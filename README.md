# Drowsiness Detection System

A real-time drowsiness detection system using React, FastAPI, WebSockets, HTML5 Canvas, and dlib. The application streams video frames from the user's webcam to a Python backend which analyzes eye aspect ratios to detect signs of drowsiness.

## Tech Stack

### Frontend
- React (Vite + TypeScript)
- HTML5 Canvas for frame capture
- WebSocket client for real-time communication

### Backend
- FastAPI (Python)
- dlib for facial landmark detection (https://dlib.net/)
- uses dlib's shape_predictor_68_face_landmarks model (https://github.com/davisking/dlib-models/blob/master/shape_predictor_68_face_landmarks.dat.bz2)
- OpenCV for video frame processing

## Features

- Captures webcam feed using `getUserMedia`
- Extracts frames via `canvas` and convert to blob and then to Base64 string using FileReader.
- Streams frames to the backend using WebSocket
- Uses `dlib` to extracts facial points and calculate eye aspect ratio (EAR)
- Detects prolonged eye closure (drowsiness)
- Sends detection results back to frontend in real-time

