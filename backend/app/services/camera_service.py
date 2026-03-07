import os
from typing import Dict, Iterable, Tuple

import cv2
from ultralytics import YOLO

from app.models.admin_models import Camera, CameraCrowdStatus, CrowdStatusLevel


BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)


CAMERA_DEFINITIONS = [
    (1, "Entry Gate", "entry.mp4"),
    (2, "Exit Gate", "exit.mp4"),
    (3, "Railway Entry", "railentry.mp4"),
    (4, "Bus Stop", "stop.mp4"),
    (5, "Waiting Area", "wait.mp4"),
]


CAMERAS = [
    Camera(
        id=cid,
        name=name,
        video=video,
        path=os.path.join(BASE_DIR, video),
    )
    for cid, name, video in CAMERA_DEFINITIONS
]


_camera_state: Dict[int, Dict[str, int | bool]] = {
    cam.id: {"people_count": 0, "active": False} for cam in CAMERAS
}


_yolo_model: YOLO | None = None


def _get_model() -> YOLO:
    global _yolo_model
    if _yolo_model is None:
        # Uses default YOLOv8n weights; ultralytics handles download/caching.
        _yolo_model = YOLO("yolov8n.pt")
    return _yolo_model


def list_cameras() -> Iterable[Camera]:
    return CAMERAS


def get_camera(camera_id: int) -> Camera | None:
    for cam in CAMERAS:
        if cam.id == camera_id:
            return cam
    return None


def _detect_people(frame) -> Tuple[int, any]:
    """Run YOLO person detection and draw bounding boxes."""
    model = _get_model()
    results = model(frame, classes=[0])  # class 0 = person in COCO
    people_count = 0
    for r in results:
        if r.boxes is None:
            continue
        for box in r.boxes:
            cls_id = int(box.cls[0])
            if cls_id != 0:
                continue
            people_count += 1
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cv2.rectangle(frame, (x1, y1), (x2, y2), (91, 44, 111), 2)
    return people_count, frame


def generate_mjpeg_stream(camera_id: int):
    cam = get_camera(camera_id)
    if not cam:
        return

    cap = cv2.VideoCapture(cam.path)
    if not cap.isOpened():
        return

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                # Loop the video for demo purposes
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            people_count, annotated = _detect_people(frame)
            state = _camera_state.get(camera_id) or {}
            state["people_count"] = people_count
            state["active"] = True
            _camera_state[camera_id] = state

            ok, buffer = cv2.imencode(".jpg", annotated)
            if not ok:
                continue
            frame_bytes = buffer.tobytes()
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
            )
    finally:
        cap.release()
        state = _camera_state.get(camera_id) or {}
        state["active"] = False
        _camera_state[camera_id] = state


def get_camera_state(camera_id: int) -> Dict[str, int | bool]:
    return _camera_state.get(camera_id, {"people_count": 0, "active": False})


def compute_crowd_status(people_count: int) -> CrowdStatusLevel:
    if people_count < 20:
        return "Safe"
    if people_count < 50:
        return "Warning"
    return "Overcrowded"


def summarize_crowd() -> Tuple[list[CameraCrowdStatus], int, CrowdStatusLevel]:
    statuses: list[CameraCrowdStatus] = []
    total = 0
    for cam in CAMERAS:
        state = get_camera_state(cam.id)
        count = int(state.get("people_count", 0) or 0)
        total += count
        level = compute_crowd_status(count)
        statuses.append(
            CameraCrowdStatus(
                id=cam.id,
                name=cam.name,
                people_count=count,
                status=level,
            )
        )

    overall_level = compute_crowd_status(total)
    return statuses, total, overall_level

