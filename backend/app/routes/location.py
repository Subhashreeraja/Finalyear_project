from flask import Blueprint, jsonify

bp = Blueprint("location", __name__)

# Sample data for districts, places, zones (replace with DB later)
DISTRICTS = [
    {"id": "d1", "name": "Central District", "lat": 13.0827, "lng": 80.2707, "placeCount": 3},
    {"id": "d2", "name": "North District", "lat": 13.0878, "lng": 80.2085, "placeCount": 2},
    {"id": "d3", "name": "South District", "lat": 13.0150, "lng": 80.2592, "placeCount": 2},
]

PLACES_BY_DISTRICT = {
    "d1": [
        {"id": "p1", "districtId": "d1", "name": "Central Railway Station", "type": "railway_station", "lat": 13.0827, "lng": 80.2707},
        {"id": "p2", "districtId": "d1", "name": "City Bus Stand", "type": "bus_stand", "lat": 13.0819, "lng": 80.2751},
        {"id": "p3", "districtId": "d1", "name": "Main Market", "type": "market", "lat": 13.0845, "lng": 80.2680},
    ],
    "d2": [
        {"id": "p4", "districtId": "d2", "name": "North Railway Station", "type": "railway_station", "lat": 13.0878, "lng": 80.2085},
        {"id": "p5", "districtId": "d2", "name": "Temple Square", "type": "temple", "lat": 13.0900, "lng": 80.2100},
    ],
    "d3": [
        {"id": "p6", "districtId": "d3", "name": "South Bus Stand", "type": "bus_stand", "lat": 13.0150, "lng": 80.2592},
        {"id": "p7", "districtId": "d3", "name": "Event Ground", "type": "event_ground", "lat": 13.0180, "lng": 80.2610},
    ],
}

def get_place_by_id(place_id):
    for places in PLACES_BY_DISTRICT.values():
        for p in places:
            if p["id"] == place_id:
                return p
    return None

def make_zones(place_id, lat, lng):
    d = 0.002
    return [
        {"id": "z1", "placeId": place_id, "name": "Zone 1", "order": 1, "polygon": [[lat - d, lng - d], [lat + d, lng - d], [lat + d, lng], [lat - d, lng]], "crowdLevel": "low", "crowdCount": 50, "capacity": 500},
        {"id": "z2", "placeId": place_id, "name": "Zone 2", "order": 2, "polygon": [[lat - d, lng], [lat + d, lng], [lat + d, lng + d], [lat - d, lng + d]], "crowdLevel": "moderate", "crowdCount": 320, "capacity": 500},
        {"id": "z3", "placeId": place_id, "name": "Zone 3", "order": 3, "polygon": [[lat, lng - d], [lat + d * 1.5, lng - d], [lat + d * 1.5, lng + d], [lat, lng + d]], "crowdLevel": "high", "crowdCount": 480, "capacity": 500},
    ]

@bp.route("/districts", methods=["GET"])
def list_districts():
    return jsonify(DISTRICTS)

@bp.route("/districts/<district_id>/places", methods=["GET"])
def list_places(district_id):
    places = PLACES_BY_DISTRICT.get(district_id, [])
    return jsonify(places)

@bp.route("/places/<place_id>", methods=["GET"])
def get_place(place_id):
    p = get_place_by_id(place_id)
    if not p:
        return jsonify({"error": "Place not found"}), 404
    return jsonify(p)

@bp.route("/places/<place_id>/zones", methods=["GET"])
def list_zones(place_id):
    p = get_place_by_id(place_id)
    if not p:
        return jsonify({"error": "Place not found"}), 404
    zones = make_zones(place_id, p["lat"], p["lng"])
    return jsonify(zones)

@bp.route("/places/<place_id>/zones/status", methods=["GET"])
def zone_status(place_id):
    p = get_place_by_id(place_id)
    if not p:
        return jsonify({"error": "Place not found"}), 404
    zones = make_zones(place_id, p["lat"], p["lng"])
    from datetime import datetime
    status = [
        {"zoneId": z["id"], "zoneName": z["name"], "crowdLevel": z["crowdLevel"], "crowdCount": z["crowdCount"], "capacity": z["capacity"], "updatedAt": datetime.utcnow().isoformat() + "Z"}
        for z in zones
    ]
    return jsonify(status)
