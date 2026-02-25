from flask import Blueprint, jsonify

bp = Blueprint("location", __name__)

# Sample data for districts, places, zones (replace with DB later)
# Updated to use real Tamil Nadu districts to match the frontend mocks.
DISTRICTS = [
    {"id": "d1", "name": "Chennai", "lat": 13.0827, "lng": 80.2707, "placeCount": 3},
    {"id": "d2", "name": "Salem", "lat": 11.6643, "lng": 78.1460, "placeCount": 2},
    {"id": "d3", "name": "Coimbatore", "lat": 11.0168, "lng": 76.9558, "placeCount": 2},
]

PLACES_BY_DISTRICT = {
    "d1": [
        {
            "id": "p1",
            "districtId": "d1",
            "name": "Chennai Central Railway Station",
            "type": "railway_station",
            "lat": 13.0827,
            "lng": 80.2707,
        },
        {
            "id": "p2",
            "districtId": "d1",
            "name": "Chennai Mofussil Bus Terminus",
            "type": "bus_stand",
            "lat": 13.0820,
            "lng": 80.2751,
        },
        {
            "id": "p3",
            "districtId": "d1",
            "name": "T. Nagar Market",
            "type": "market",
            "lat": 13.0358,
            "lng": 80.2300,
        },
    ],
    "d2": [
        {
            "id": "p4",
            "districtId": "d2",
            "name": "Salem Railway Junction",
            "type": "railway_station",
            "lat": 11.6643,
            "lng": 78.1460,
        },
        {
            "id": "p5",
            "districtId": "d2",
            "name": "Kottai Mariamman Temple",
            "type": "temple",
            "lat": 11.6648,
            "lng": 78.1450,
        },
    ],
    "d3": [
        {
            "id": "p6",
            "districtId": "d3",
            "name": "Gandhipuram Bus Stand",
            "type": "bus_stand",
            "lat": 11.0170,
            "lng": 76.9660,
        },
        {
            "id": "p7",
            "districtId": "d3",
            "name": "Codissia Event Ground",
            "type": "event_ground",
            "lat": 11.0290,
            "lng": 77.0380,
        },
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
