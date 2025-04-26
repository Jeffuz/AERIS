from ultralytics import YOLO
import cv2
import os
import glob
from supabase import create_client, Client

# Load model
model = YOLO("best.pt")

# Create output directory
os.makedirs("outputs", exist_ok=True)

SUPABASE_URL = "https://lrhlhujoduwhgtvmtsug.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyaGxodWpvZHV3aGd0dm10c3VnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTY5OTY1OCwiZXhwIjoyMDYxMjc1NjU4fQ.FE59ICr_2Fig5AVl1DydL6aLTxe3YAvQWWpMTCQmf8A"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
BUCKET_NAME = "aeris-cv-imgs"

def resize_and_pad(img, target_size=(640, 640), pad_color=(0, 0, 0)):
    h, w = img.shape[:2]
    target_w, target_h = target_size

    scale = min(target_w / w, target_h / h)
    new_w, new_h = int(w * scale), int(h * scale)
    resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

    pad_w = target_w - new_w
    pad_h = target_h - new_h
    top = pad_h // 2
    bottom = pad_h - top
    left = pad_w // 2
    right = pad_w - left

    padded = cv2.copyMakeBorder(resized, top, bottom, left, right, cv2.BORDER_CONSTANT, value=pad_color)
    return padded

# Preprocess images
input_dir = "imgs/"
preprocessed_dir = "preprocessed_imgs/"
os.makedirs(preprocessed_dir, exist_ok=True)

image_paths = glob.glob(os.path.join(input_dir, "*"))
for img_path in image_paths:
    img = cv2.imread(img_path)
    if img is None:
        continue
    padded_img = resize_and_pad(img, target_size=(640, 640))
    filename = os.path.basename(img_path)
    cv2.imwrite(os.path.join(preprocessed_dir, filename), padded_img)

# Inference on preprocessed images
results = model(preprocessed_dir, conf=0.3)

for i, r in enumerate(results):
    img = r.orig_img.copy()
    issue_count = 1 # reset counter per image

    for box in r.boxes.data:
        x1, y1, x2, y2 = map(int, box[:4])
        conf = float(box[4])
        if conf > 0.3:
            label = f"Issue #{issue_count}"
            cv2.rectangle(img, (x1, y1), (x2, y2), (100, 100, 255), 2)
            cv2.putText(img, f"{label}", (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 100, 255), 2)
            issue_count += 1

    output_path = f"outputs/image_{i}.jpg"
    cv2.imwrite(output_path, img)

    # Upload to Supabase Storage
    with open(output_path, "rb") as f:
        supabase.storage.from_(BUCKET_NAME).upload(f"image_{i}.jpg", f)

print("✅ Done! Check the 'outputs' folder and Supabase Storage.")