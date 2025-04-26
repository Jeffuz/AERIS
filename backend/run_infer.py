from ultralytics import YOLO
import cv2
import os

# Load model
model = YOLO("best.pt")

# Create output directory
os.makedirs("outputs", exist_ok=True)

# Open the video file
video = cv2.VideoCapture("people.mp4")

# Get video properties
fps = int(video.get(cv2.CAP_PROP_FPS))
frame_interval = fps * 2  # Get a frame every 2 seconds

frame_count = 0
saved_count = 0

while video.isOpened():
    ret, frame = video.read()
    if not ret:
        break
    
    # Process every nth frame (n = frame_interval)
    if frame_count % frame_interval == 0:
        # Run inference on the frame
        results = model(frame, conf=0.3)[0]
        img = frame.copy()
        issue_count = 1

        for box in results.boxes.data:
            x1, y1, x2, y2 = map(int, box[:4])
            conf = float(box[4])
            if conf > 0.3:
                label = f"Issue #{issue_count}"
                cv2.rectangle(img, (x1, y1), (x2, y2), (100, 100, 255), 2)
                cv2.putText(img, f"{label}", (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 100, 255), 2)
                issue_count += 1

        cv2.imwrite(f"outputs/frame_{saved_count}.jpg", img)
        saved_count += 1
    
    frame_count += 1

video.release()
print(f"✅ Done! Processed {saved_count} frames. Check the 'outputs' folder.")