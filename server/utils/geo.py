"""Distance helpers (used to tell riders how far their pickup is)."""
from math import asin, cos, radians, sin, sqrt

EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two points, in kilometres."""
    dlat = radians(lat2 - lat1) / 2
    dlon = radians(lon2 - lon1) / 2
    a = sin(dlat) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon) ** 2
    return EARTH_RADIUS_KM * 2 * asin(sqrt(a))
