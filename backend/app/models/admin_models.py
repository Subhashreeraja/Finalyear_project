from dataclasses import dataclass
from typing import List, Literal, Optional


Role = Literal["admin"]


@dataclass
class AdminUser:
    email: str
    name: str
    role: Role = "admin"


@dataclass
class Camera:
    id: int
    name: str
    video: str
    path: str


CrowdStatusLevel = Literal["Safe", "Warning", "Overcrowded"]


@dataclass
class CameraCrowdStatus:
    id: int
    name: str
    people_count: int
    status: CrowdStatusLevel


@dataclass
class OverviewResponse:
    total_cameras: int
    active_cameras: int
    total_crowd_count: int
    overcrowded: bool
    gate_status: Literal["open", "closed"]


@dataclass
class CrowdStatusResponse:
    cameras: List[CameraCrowdStatus]
    total_count: int
    status: CrowdStatusLevel
    alert_triggered: bool
    whatsapp_sent: Optional[bool]

