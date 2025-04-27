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

load_dotenv()
app = FastAPI()

supabase_url = os.getenv("SUPABASE_URL_KEY")
supabase_key = os.getenv("SUPABASE_ANON_KEY")

supabase: Client = create_client(supabase_url, supabase_key)


@app.get("/")
def read_root():
    return (
        supabase.table('entities').select('*').execute()
    )


@app.post("/aries/drone_update")
async def process_video(video: UploadFile = File(...), form_data: str = Form(None)):
    try:
    
        detections = []
        video_path = f"temp_{video.filename}"

        with open(video_path, "wb") as buffer:
            content = await video.read()
            buffer.write(content)
        
        stl_path = video_path.with_suffix(".stl")
        ec.extract_subtitles(video_path, stl_path)
        
        csv_path = video_path.with_suffix(".csv")
        df = sp.process_input(str(stl_path))
        df.to_csv(csv_path, index=False)

        video = cv2.VideoCapture(video_path)
        fps = int(video.get(cv2.CAP_PROP_FPS))
        frame_skip = 12
        frame_count = 0

        width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
        is_vertical = (height > width)
    
        while video.isOpened():
            try:
                ret, frame = video.read()

                if not ret:
                    break
                    
                frame_count += 1
                if frame_count % frame_skip != 0:
                    continue
                    
                if is_vertical:
                    frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
                    
                detection = ri.process_frame(frame, csv_path, frame_count)

                if detection:
                    supabase.table("images").insert(detection).execute()

            except Exception as e:
                print(f"Error: {e}")

            # Primary Detection Structure:
            # 
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
        os.remove(video_path)   

    except Exception as e:
        print(f"Error: {e}")
        if os.path.exists(video_path):
            os.remove(video_path)
