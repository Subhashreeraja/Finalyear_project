from dataclasses import dataclass
from typing import List, Literal, Optional


Role = Literal["admin"]


@dataclass
class AdminUser:
    email: str
    name: str
    role: Role = "admin"


PlaceType = Literal["railway_station", "mall", "market", "bus_stand", "temple"]


@dataclass
class Camera:
    id: int
    name: str
    video: str
    path: str
    place_type: PlaceType


CrowdStatusLevel = Literal["Safe", "Warning", "Overcrowded"]


@dataclass
class CameraCrowdStatus:
    id: int
    name: str
    people_count: int
    status: CrowdStatusLevel
    place_type: PlaceType


@dataclass
class PlaceOverview:
    place_type: PlaceType
    total_cameras: int
    active_cameras: int
    total_crowd_count: int
    gate_status: Literal["open", "closed"]


@dataclass
class OverviewResponse:
    total_cameras: int
    active_cameras: int
    total_crowd_count: int
    overcrowded: bool
    gate_status: Literal["open", "closed"]
    places: List[PlaceOverview]


@dataclass
class CrowdStatusResponse:
    cameras: List[CameraCrowdStatus]
    total_count: int
    status: CrowdStatusLevel
    alert_triggered: bool
    whatsapp_sent: Optional[bool]

