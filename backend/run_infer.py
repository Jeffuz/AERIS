from ultralytics import YOLO
import cv2
import os
from pathlib import Path
from groq import Groq
from dotenv import load_dotenv
import base64

load_dotenv()

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

def victim_triage(image_path):
    try:
        with open(image_path, "rb") as image:
            encoded_image = base64.b64encode(image.read()).decode('utf-8')
        
        prompt = """
        You are a medical image analyzer. Analyze the following medical image and provide an assessment of the victim's condition based off the triage framework:
        
        RED: Patients who have life-threatening injuries that are treatable with a minimum amount of time, personnel, and supplies. These patients also have a good chance of recovery.
        YELLOW: Indicates that treatment may be delayed for a limited period of time without significant mortality or in the ICU setting patients for whom life support may or may not change their outcome given the severity of their illness.
        GREEN: Patients with minor injuries whose treatment may be delayed until the patients in the other categories have been dealt with or patients who do not require ICU admission for the provision of life support.
        BLUE: Patients who have injuries requiring extensive treatment that exceeds the medical resources available in the situation or for whom life support is considered futile.
        BLACK: Patients who are in cardiac arrest and for which resuscitation efforts are not going to be provided.

        Please provide ONLY the 30 word analysis of the image (no other strings), then one line down place ONLY the triage ranking.    
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
            "analysis": response.choices[0].message.content,
            "raw_response": response
        }
    
    except Exception as e:
        return {
            "error": f"Error in image analysis: {str(e)}",
            "analysis": None
        }

def process_video(model, video_path):
    video = cv2.VideoCapture(video_path)
    fps = int(video.get(cv2.CAP_PROP_FPS))
    frame_interval = fps * 2
    frame_count = 0
    saved_count = 0

    width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
    is_vertical = height > width
    
    while video.isOpened():
        ret, img = video.read()
        frame = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
        if not ret:
            break
        if frame_count % frame_interval == 0:
            results = model.predict(frame, conf=0.3, save=False, save_txt=False)[0]
            # Filter only classes
            filtered_boxes = [box for box in results.boxes if int(box.cls[0]) in ALLOWED_CLASSES]
            if len(filtered_boxes) > 0:
                results.boxes = filtered_boxes
                predicted_frame = results.plot()
                timestamp = video.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
                frame_path = f"outputs/detection_{saved_count}_time_{timestamp:.2f}s.jpg"
                cv2.imwrite(frame_path, predicted_frame)
                print(victim_triage(frame_path))
                saved_count += 1
        frame_count += 1
    video.release()
    return saved_count

def process_image(model, image_path):
    image = cv2.imread(image_path)
    if image is None:
        print(f"Error: Could not load image {image_path}")
        return 0
    
    results = model.predict(image, conf=0.3, save=False, save_txt=False)[0]
    filtered_boxes = [box for box in results.boxes if int(box.cls[0]) in ALLOWED_CLASSES]
    
    # Filter only classes
    if len(filtered_boxes) > 0:
        results.boxes = filtered_boxes
        predicted_image = results.plot()
        output_path = f"outputs/detection_{Path(image_path).stem}.jpg"
        cv2.imwrite(output_path, predicted_image)
        return 1
    return 0

def process_input(input_path):
    # Load model and output
    model = YOLO("best.pt")
    os.makedirs("outputs", exist_ok=True)
    
    file_ext = Path(input_path).suffix.lower()
    video_extensions = ['.mp4', '.avi', '.mov', '.mkv']
    image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
    
    if file_ext in video_extensions:
        saved_count = process_video(model, input_path)
    elif file_ext in image_extensions:
        saved_count = process_image(model, input_path)
    else:
        print("Unsupported File Type")

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Needs to be in format: python run_infer.py <path_to_file>")
    else:
        process_input(sys.argv[1])
        