from ultralytics import YOLO
import cv2
import os
from pathlib import Path
from groq import Groq
from dotenv import load_dotenv
import base64
import pandas as pd
import time
import numpy as np

import extract_clean as ec

load_dotenv()

CONFIDENCE_THRESHOLD = 0.2
prev_person_boxes = 0
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq = Groq(api_key=GROQ_API_KEY)

ALLOWED_CLASSES = {
    0: 'flood',
    1: 'person',
    2: 'fire',
    4: 'smoke',
    5: 'collapsed building',
    6: 'collapsed road',
    7: 'collapsed roof',
    8: 'collapsedhouse',
    9: 'damaged train',
    10: 'debri on ground',
    11: 'house on fire'
}

def victim_triage(encoded_image):

    prompt = """
    You are a medical image analyzer. Analyze the following medical image and provide an assessment of the victim's condition based off the triage framework:
    
    RED: Patients who have life-threatening injuries that are treatable with a minimum amount of time, personnel, and supplies. These patients also have a good chance of recovery.
    YELLOW: Indicates that treatment may be delayed for a limited period of time without significant mortality or in the ICU setting patients for whom life support may or may not change their outcome given the severity of their illness.
    GREEN: Patients with minor injuries whose treatment may be delayed until the patients in the other categories have been dealt with or patients who do not require ICU admission for the provision of life support.
    BLUE: Patients who have injuries requiring extensive treatment that exceeds the medical resources available in the situation or for whom life support is considered futile.
    BLACK: Patients who are in cardiac arrest and for which resuscitation efforts are not going to be provided.

    There are sometimes errors, if the image does not contain a person classify as NULL.

    For testing purposes, if the person is CROSSING THEIR ARMS, classify them as RED. If the person HAS THEIR HANDS ON THEIR HEADS, ignore the triage system and classify them as FIRE.

    Please provide ONLY the 30 word analysis of the image with no other strings. Then seperate the analysis with a === and place ONLY the triage ranking with no punctuation.    
    """
    
    response = groq.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": [
                {"type": "text", "text": "Please provide a detailed analysis of the following image:"},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{encoded_image}"}}
            ]}
        ],
        temperature=0.3,
        max_tokens=300
    )
    
    return {
        "severity": response.choices[0].message.content.split("===")[1],
        "description": response.choices[0].message.content.split("===")[0]
    }

def image_description(encoded_image):
    
    prompt = """
    You are a medical image analyzer. Analyze the following medical image and provide an assessment of the victim's condition based off the triage framework:
    
    RED: Patients who have life-threatening injuries that are treatable with a minimum amount of time, personnel, and supplies. These patients also have a good chance of recovery.
    YELLOW: Indicates that treatment may be delayed for a limited period of time without significant mortality or in the ICU setting patients for whom life support may or may not change their outcome given the severity of their illness.
    GREEN: Patients with minor injuries whose treatment may be delayed until the patients in the other categories have been dealt with or patients who do not require ICU admission for the provision of life support.
    BLUE: Patients who have injuries requiring extensive treatment that exceeds the medical resources available in the situation or for whom life support is considered futile.
    BLACK: Patients who are in cardiac arrest and for which resuscitation efforts are not going to be provided.

    Please provide a maximum 80 word analysis of the image with people's triage classifications. Include no other strings. Do not mention the classification color in your analysis.  
    """
    
    response = groq.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": [
                {"type": "text", "text": "Please provide a detailed analysis of the following image:"},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{encoded_image}"}}
            ]}
        ],
        temperature=0.3,
        max_tokens=500
    )
    
    return response.choices[0].message.content
    

def adjust_brightness(frame, brightness=1.2, contrast=1.4):
    # Ensure frame is a numpy array
    if frame is None:
        return None
    # Adjust brightness and contrast
    adjusted = cv2.convertScaleAbs(frame, alpha=contrast, beta=brightness * 50)
    return adjusted

def process_frame(frame, csv_path, frame_count, model=YOLO("best_old.pt")):
        
    # frame = adjust_brightness(frame)

    os.makedirs("outputs", exist_ok=True)

    results = model.predict(frame, conf=CONFIDENCE_THRESHOLD, save=False, save_txt=False, verbose=False)[0]
    person_boxes = [box for box in results.boxes if int(box.cls[0]) == 1]
    
    if len(person_boxes) > 0:
        instances = []

        results.boxes = person_boxes
        predicted_frame = results.plot()

        df = pd.read_csv(csv_path)
        timestamp = int(frame_count / 60)
        print(timestamp)
        gps_lat = df.loc[df['start_seconds'] == timestamp, 'gps_lat'].iloc[0]
        gps_lon = df.loc[df['start_seconds'] == timestamp, 'gps_lon'].iloc[0]

        frame_path = f"outputs/detection_{timestamp}.jpg"
        cv2.imwrite(frame_path, predicted_frame)
        
        # Process each detected person
        for i, box in enumerate(person_boxes):
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            person_crop = frame[y1:y2, x1:x2]
            _, buffer = cv2.imencode('.jpg', person_crop)
            encoded_crop = base64.b64encode(buffer).decode('utf-8')
            crop_path = f"outputs/person_{timestamp}_{i}.jpg"
            cv2.imwrite(crop_path, person_crop)
            
            analysis = victim_triage(encoded_crop)
            instances.append({
                "severity": analysis["severity"],
                "image": encoded_crop
            })
        
        if len(instances) > 0:
            with open(frame_path, "rb") as img_file:
                main_image = base64.b64encode(img_file.read()).decode('utf-8')
                
            return {
                "main_image": main_image,
                "description": image_description(main_image),
                "lon": gps_lon,
                "lat": gps_lat,
                "instances": instances
            }

    return None


if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Needs to be in format: python run_infer.py <path_to_file>")
    else:
        process_frame(sys.argv[1])
        