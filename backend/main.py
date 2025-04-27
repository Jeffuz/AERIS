from typing import Union
import run_infer as ri
import extract_clean as ec
import stl_parser as sp
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse, StreamingResponse
import base64
import os
from pathlib import Path
import cv2
import time
import asyncio
import json
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL_KEY")
supabase_key = os.getenv("SUPABASE_ANON_KEY")
print(f"Supabase URL: {supabase_url}")  # Debug print
print(f"Supabase Key exists: {bool(supabase_key)}")  # Debug print
supabase: Client = create_client(supabase_url, supabase_key)

app = FastAPI()

@app.get("/")
def read_root():
    return (
        supabase.table('entities').select('*').execute()
    )

async def process_video_stream(video_path: str):
    async for result in ri.process_input(video_path):
        if result:
            # Get the main image
            with open(result["frame_path"], "rb") as img_file:
                main_image = base64.b64encode(img_file.read()).decode('utf-8')
            
            # Create the response
            response = {
                "status": "success",
                "message": "Frame processed",
                "main_image": main_image,
                "description": ri.image_description(main_image),
                "lon": result["gps_lon"],
                "lat": result["gps_lat"],
                "detections": result["instances"]
            }
            
            # Yield the response as JSON
            yield json.dumps(response) + "\n"

@app.post("/aries/drone_update")
async def process_video(video: UploadFile = File(...), form_data: str = Form(None)):
    try:
        detections = []
        # Create a temporary file to save the uploaded video
        temp_video_path = f"temp_{video.filename}"
        with open(temp_video_path, "wb") as buffer:
            content = await video.read()
            buffer.write(content)
        
        # Process the video
        video_path = Path(temp_video_path)
        stl_path = video_path.with_suffix(".stl")
        ec.extract_subtitles(video_path, stl_path)
        
        # Parse STL and save to CSV
        csv_path = video_path.with_suffix(".csv")
        df = sp.process_input(str(stl_path))
        df.to_csv(csv_path, index=False)

        video = cv2.VideoCapture(temp_video_path)
        fps = int(video.get(cv2.CAP_PROP_FPS))
        frame_skip = 12
        frame_count = 0
        saved_count = 0
        instances = []

        width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
        is_vertical = height > width
    
        while video.isOpened():
            ret, img = video.read()
            if not ret:
                break
                
            # Skip frames
            frame_count += 1
            if frame_count % frame_skip != 0:
                continue
                
            if is_vertical:
                frame = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
            else:
                frame = img
                
            detection = ri.process_frame(frame, csv_path, frame_count)

            if detection:
                try:
                    # Create a copy of detection without the large base64 images
                    detection_log = detection.copy()
                    detection_log["main_image"] = "[base64 image data]"
                    detection_log["instances"] = [
                        {**instance, "image": "[base64 image data]"}
                        for instance in detection["instances"]
                    ]
                    print(f"Sending detection: {detection_log}")
                    supabase.table("images").insert(detection).execute()
                except Exception as e:
                    print(f"Error sending detection to Supabase: {e}")

            # {
            #     "main_image": main_image,
            #     "description": image_description(main_image),
            #     "lon": gps_lon,
            #     "lat": gps_lat,
            #     "instances": [
            #         {
            #             "image": encoded_crop,
            #             "severity": analysis["severity"]
            #         },
            #         {
            #             "image": encoded_crop,
            #             "severity": analysis["severity"]
            #         },
            #     ]
            # }

        video.release()
        os.remove(temp_video_path)   

    except Exception as e:
        print(f"Error processing video: {e}")
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)
