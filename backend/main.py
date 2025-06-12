from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import torch
from typing import Dict, List, Any
import threading
from ultralytics import YOLO
import datetime
import os

from fast_plate_ocr import ONNXPlateRecognizer

app = FastAPI()
lock = threading.Lock()
analytics = {"total_images": 0, "successful_plates": 0, "last_plate": "N/A"}

origins = [
    "http://localhost:3000",  # Your local React app
    "https://plate-q9q2qmwt4-htet-aungs-projects-48c9fdcb.vercel.app"  # Your deployed Vercel app
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Use the new list here
    allow_credentials=True,
    allow_methods=["*"],    # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],    # Allow all headers
)
device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"--- Using device for YOLO: {device} ---")

YOLO_MODEL_PATH = os.path.abspath('weights/best.pt')
try:
    model_yolo = YOLO(YOLO_MODEL_PATH)
    model_yolo.to(device)
    print(f"✅ YOLO model loaded: '{YOLO_MODEL_PATH}' on {device}")
except Exception as e:
    print(f"❌ Error loading YOLO model: {e}")
    raise SystemExit("YOLO model loading failed.")

FASTPLATE_OCR_MODEL_PATH = "global-plates-mobile-vit-v2-model"
fastplate_ocr_model = None
try:
    fastplate_ocr_model = ONNXPlateRecognizer(FASTPLATE_OCR_MODEL_PATH)
    print(f"✅ FastPlateOCR model loaded from local path: '{FASTPLATE_OCR_MODEL_PATH}'")
except Exception as e:
    print(f"❌ Error initializing FastPlateOCR model from local path: {e}")

# --- CHANGE START: Modified endpoint to handle multiple detections ---
@app.post("/detect-plate", response_model=Dict[str, List[Dict[str, Any]]])
async def detect_plate(file: UploadFile = File(...)):
    """
    Detects ALL license plates in an image, crops them, and returns a list of results.
    """
    contents = await file.read()
    np_img = np.frombuffer(contents, np.uint8)
    original_image = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    if original_image is None:
        return {"detections": []}

    # --- 1. Plate Detection using YOLO ---
    yolo_confidence_threshold = 0.40
    results = model_yolo(original_image, conf=yolo_confidence_threshold, iou=0.5, device=device)
    
    detections = results[0].boxes
    detected_plates = [] # List to store all results

    if detections and len(detections) > 0:
        # Loop through ALL detections instead of finding the max
        for detection in detections:
            box_coords = detection.xyxy[0].cpu().numpy()
            x1, y1, x2, y2 = map(int, box_coords)
            
            # Crop the detected plate
            plate_crop = original_image[y1:y2, x1:x2]

            if plate_crop.size == 0:
                continue # Skip if crop is empty

            # --- 2. Plate Recognition for each crop ---
            final_plate_text = "Unreadable"
            if fastplate_ocr_model:
                try:
                    gray_plate_crop = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)
                    raw_ocr_text = fastplate_ocr_model.run(gray_plate_crop)
                    
                    if raw_ocr_text:
                        plate_text = raw_ocr_text[0] if isinstance(raw_ocr_text, list) else raw_ocr_text
                        if plate_text: # Ensure text is not empty
                           final_plate_text = plate_text
                except Exception:
                    pass # Ignore OCR errors for individual plates
            
            # Add the result to our list
            detected_plates.append({
                "plate": final_plate_text,
                "box": [x1, y1, x2, y2] # Send coordinates to the frontend
            })

    # --- 3. Logging and Response ---
    timestamp_str = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{timestamp_str}] Found {len(detected_plates)} plate(s) in {file.filename}")

    with lock:
        analytics["total_images"] += 1
        successful_reads = [d for d in detected_plates if d["plate"] != "Unreadable"]
        if successful_reads:
            analytics["successful_plates"] += len(successful_reads)
            analytics["last_plate"] = ", ".join([d["plate"] for d in successful_reads])

    return {"detections": detected_plates}
# --- CHANGE END ---


@app.get("/analytics")
def get_analytics() -> Dict[str, Any]:
    with lock:
        total = analytics["total_images"]
        success = analytics["successful_plates"]
        accuracy = (success / total * 100) if total > 0 else 0.0
    return {
        "total_images": total,
        "successful_plates": success,
        "accuracy": round(accuracy, 2),
        "last_plate": analytics["last_plate"],
    }


if __name__ == "__main__":
    import uvicorn
    print("--- Starting FastAPI application (Multi-Plate Enabled) ---")
    uvicorn.run(app, host="0.0.0.0", port=8000)
