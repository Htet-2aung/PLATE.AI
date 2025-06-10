# PLATE.AI: Advanced License Plate Recognition System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**PLATE.AI** is a full-stack web application demonstrating a complete, end-to-end pipeline for high-accuracy Vietnamese license plate detection and recognition. The system features a custom-trained YOLOv11n model, a real-time processing backend, and a modern, interactive frontend built with React.

This project is designed not only as a functional tool but also as a comprehensive showcase of modern AI and web development practices, from data preparation and model training to deployment and user interface design.

![image](https://github.com/Htet-2aung/PLATE.AI/blob/main/assets/Captura%20de%20pantalla%202025-06-09%20181711.png?raw=true) 
![image](https://github.com/Htet-2aung/PLATE.AI/blob/main/assets/Captura%20de%20pantalla%202025-06-09%20181720.png?raw=true)
## ✨ Key Features

- **High-Accuracy AI Model**: At its core, the application utilizes a custom-trained **YOLOv11n model**. This model was trained for 150 epochs on a specialized dataset of over 3,300 Vietnamese license plate images, achieving a high mean average precision (mAP@0.5) of **0.993**.
- **Multi-Modal Input**: Users can analyze license plates from static images, video files, or directly from a live webcam feed, demonstrating the model's versatility in different scenarios.
- **Advanced OCR Engine**: The system employs a specialized ONNX-based OCR engine via the `FastPlateOCR` library, ensuring rapid and precise character extraction from the detected plates.
- **Real-Time Analytics Dashboard**: The application features a dynamic dashboard that visualizes the model's cumulative performance. This includes an interactive donut chart showing the success rate and live-updating statistics on total images processed and accuracy.
- **Modern & Responsive UI**: A fully responsive interface built with React and styled with Tailwind CSS, featuring smooth animations (Framer Motion), a Lottie-based hero section, and a persistent light/dark mode toggle.
- **Multi-Plate Detection**: The backend is architected to identify, process, and return data for all license plates found within a single image or video frame.

## 🛠️ Technology Stack

The project is built on a modern, robust stack, cleanly separating the frontend and backend concerns.

#### **Frontend**
- **Framework**: React
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion & Lottie
- **Charting**: Chart.js with `react-chartjs-2`
- **API Communication**: Axios

#### **Backend**
- **Framework**: FastAPI (Python)
- **AI/ML Libraries**: PyTorch, Ultralytics (YOLO), OpenCV
- **OCR Engine**: `fast_plate_ocr` (ONNX-based)

## 🧠 AI Model Architecture & Training

The performance of PLATE.AI is driven by a carefully trained computer vision model.

- **Architecture**: The model is based on the **YOLOv11n (nano)** architecture, chosen for its excellent balance of speed and accuracy. It features 181 layers and 2,590,230 parameters.
- **Training Environment**: The model was trained in a Google Colab environment using a Tesla T4 GPU for acceleration.
- **Dataset**: A custom dataset named `License_Plates_VietNam.v3i.yolov11` was used, containing **3,391 training images** and **1,044 validation images**.
- **Training Process**:
    - The model was trained for **150 epochs**.
    - An **AdamW optimizer** was automatically selected.
    - A batch size of 16 and an image size of 640x640 were used.
- **Performance**: After 150 epochs, the model achieved the following metrics on the validation set:
    - **mAP50-95**: **0.917**
    - **mAP50**: **0.993**
    - This high level of precision demonstrates a highly reliable model for detecting both long and short Vietnamese license plates under various conditions.

## 🚀 Getting Started

To run this project locally, you will need to set up both the backend and frontend services.

### Prerequisites
- Python 3.8+ and `pip`
- Node.js and `npm`

### Backend Setup

1.  **Navigate to the `backend` directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    # For macOS/Linux
    python3 -m venv venv
    source venv/bin/activate

    # For Windows
    python -m venv venv
    venv\Scripts\activate
    ```

3.  **Install the required Python packages:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Start the FastAPI server:**
    ```bash
    uvicorn main:app --reload
    ```
    The backend API will now be running on `http://localhost:8000`.

### Frontend Setup

1.  **Navigate to the `frontend` directory in a new terminal:**
    ```bash
    cd frontend
    ```

2.  **Install the required Node modules:**
    ```bash
    npm install
    ```

3.  **Start the React development server:**
    ```bash
    npm start
    ```
    The frontend application will open automatically in your browser at `http://localhost:3000`.

## ⚙️ How It Works

The application follows a standard client-server architecture:

1.  **User Interaction**: The user selects an input mode (photo, video, or camera) on the React frontend.
2.  **API Request**: The selected media is sent to the FastAPI backend. For streams, frames are sent sequentially.
3.  **Plate Detection**: The YOLOv11 model processes the incoming frame to find bounding boxes for all potential license plates.
4.  **OCR Processing**: Each detected bounding box is cropped and sent to the FastPlateOCR engine, which recognizes the characters.
5.  **JSON Response**: The backend aggregates the results and sends a JSON payload containing the recognized text, confidence score, bounding box coordinates, and a Base64-encoded image of the crop for each detection.
6.  **Display Results**: The React frontend receives the JSON data, updates the analytics dashboard, and renders the results visually by drawing boxes over the preview and displaying the cropped plate images.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
