from ultralytics import YOLO
import cv2
import os
from pathlib import Path

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

def process_video(model, video_path):
    video = cv2.VideoCapture(video_path)
    fps = int(video.get(cv2.CAP_PROP_FPS))
    frame_interval = fps * 2
    frame_count = 0
    saved_count = 0
    
    while video.isOpened():
        ret, frame = video.read()
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
                cv2.imwrite(f"outputs/detection_{saved_count}_time_{timestamp:.2f}s.jpg", predicted_frame)
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
        