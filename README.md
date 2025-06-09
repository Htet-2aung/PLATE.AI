## 🚗 PLATE.AI: Advanced License Plate Recognition System

PLATE.AI is a full-stack web application demonstrating a complete, end-to-end pipeline for high-accuracy Vietnamese license plate detection and recognition. The system integrates a custom-trained YOLOv11n model, a real-time FastAPI backend, and a responsive React-based frontend.

This project is not only functional but also serves as a showcase of modern AI and web development practices—from dataset creation and model training to API design and interactive UI.

## ✨ Key Features
🔍 High-Accuracy Detection
Utilizes a custom-trained YOLOv11n model achieving mAP@0.5 = 0.993 on a dataset of 3,300+ Vietnamese license plates.

## 📷 Multi-Modal Input Support
Analyze plates from images, video files, or live webcam feeds.

## 🔡 Advanced OCR Engine
Character recognition powered by FastPlateOCR (ONNX-based) for fast, precise text extraction.

## 📊 Real-Time Analytics Dashboard
Live stats, a dynamic donut chart, and historical data tracking plate recognition accuracy and image processing counts.

## 💻 Modern & Responsive UI
Built with React + Tailwind CSS, animations via Framer Motion, and Lottie hero section. Supports light/dark mode.

## 🛂 Multi-Plate Detection
The system can detect and process multiple license plates per image or frame.

## 🛠️ Technology Stack
🖥️ Frontend
Framework: React

Styling: Tailwind CSS

Animations: Framer Motion, Lottie

Charting: Chart.js (via react-chartjs-2)

API Communication: Axios

⚙️ Backend
Framework: FastAPI (Python)

AI/ML: PyTorch, OpenCV, Ultralytics YOLO

OCR Engine: FastPlateOCR (ONNX-based)

## 🧠 AI Model Architecture & Training
Model Architecture: YOLOv11n (nano)

181 layers

2,590,230 parameters

Training Environment:

Google Colab with Tesla T4 GPU

Epochs: 150

Optimizer: AdamW

Image size: 640x640

Batch size: 16

Dataset:
License_Plates_VietNam.v3i.yolov11

3,391 training images

1,044 validation images

Results:

mAP50: 0.993

mAP50-95: 0.917

## 🚀 Getting Started
📦 Prerequisites
Python 3.8+

Node.js & npm

🧩 Backend Setup
bash
Copy
Edit
cd backend

# Create and activate a virtual environment
# macOS/Linux
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
uvicorn main:app --reload
The backend will be available at: http://localhost:8000

💻 Frontend Setup
bash
Copy
Edit
cd frontend

# Install dependencies
npm install

# Start React development server
npm start
The frontend will be available at: http://localhost:3000

## ⚙️ How It Works
User Interaction:
Choose input type (photo, video, webcam) from the UI.

Media Upload:
Media is sent to the FastAPI backend. Frames are streamed if using live input.

Detection:
YOLOv11n model locates all plates in each frame/image.

Recognition:
Each plate is cropped and processed by the OCR engine.

Response:
Backend returns a JSON with recognized text, confidence, bounding boxes, and cropped plate images (Base64).

Display:
The frontend visualizes detection results and updates the dashboard in real-time.

## 📄 License
This project is licensed under the MIT License.

