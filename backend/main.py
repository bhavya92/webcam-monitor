import cv2
import dlib
import imutils
import imutils.face_utils
from scipy.spatial import distance
from fastapi import FastAPI, WebSocket
import base64
import numpy as np

app = FastAPI()
MIN_EAR = 0.3
MAX_FRAME_COUNT = 6
FACE_LANDMARK_PREDICTION_MODEL = "shape_predictor_68_face_landmarks.dat"

face_detector = dlib.get_frontal_face_detector()
landmark_finder = dlib.shape_predictor(FACE_LANDMARK_PREDICTION_MODEL)
# camera = cv2.VideoCapture(0)

(left_eye_begin, left_eye_end) = imutils.face_utils.FACIAL_LANDMARKS_68_IDXS["left_eye"]

(right_eye_begin, right_eye_end) = imutils.face_utils.FACIAL_LANDMARKS_68_IDXS["right_eye"]


def eye_aspect_ratio(eye):
    p2_minus_p6 = distance.euclidean(eye[1], eye[5])
    p3_minus_p5 = distance.euclidean(eye[2], eye[4])
    p1_minus_p4 = distance.euclidean(eye[0], eye[3])
    ear = (p2_minus_p6 + p3_minus_p5) / (2.0 * p1_minus_p4)
    return ear


# for i in face_points:
#     image = cv2.circle(image, (i[0],i[1]), radius=0, color=(0,0,255), thickness=-1)

# cv2.imshow("face_points",image)
# cv2.waitKey(0)
# cv2.destroyAllWindows()

@app.websocket("/ws")
async def websocket_endpoint(websocket : WebSocket):
    await websocket.accept()
    print("connection accepted")
    NUMBER_OF_EXECUTION = 0
    EYE_CLOSED_COUNTER = 0
    while True:
        try:
            data = await websocket.receive_text()
            image_bytes = base64.b64decode(data)
            image_array = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            
            image = imutils.resize(frame, width=800)
            gray_image = cv2.cvtColor(image,cv2.COLOR_BGR2GRAY)

            faces = face_detector(gray_image,0)
            for f in faces:
                face_points = landmark_finder(gray_image,f)
                face_points = imutils.face_utils.shape_to_np(face_points)
                
                left_eye = face_points[left_eye_begin:left_eye_end] 
                right_eye = face_points[right_eye_begin:right_eye_end]
                left_ear = eye_aspect_ratio(left_eye)
                right_ear = eye_aspect_ratio(right_eye)
                final_ear = left_ear + right_ear / 2.0
                NUMBER_OF_EXECUTION = NUMBER_OF_EXECUTION + 1
                print("NUMBEROFEXEC ",NUMBER_OF_EXECUTION)
                if(final_ear < MIN_EAR):
                    EYE_CLOSED_COUNTER += 1
                    await websocket.send_text("it's fine")
                    print(EYE_CLOSED_COUNTER)
                else:
                    await websocket.send_text("it's fine")
                    EYE_CLOSED_COUNTER = 0

                if(EYE_CLOSED_COUNTER >= MAX_FRAME_COUNT):
                    print("drowsinesss detected")
                    await websocket.send_text("drowsy")
        except Exception as e:
            print("Exception thrown ",e)
            break
