import math
from typing import List, Tuple

# Base32 character set for Geohash
BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"
BITS = [16, 8, 4, 2, 1]


def encode_geohash(latitude: float, longitude: float, precision: int = 7) -> str:
    """Encodes lat/lon into a geohash string of given precision."""
    lat_range = [-90.0, 90.0]
    lon_range = [-180.0, 180.0]
    geohash = []
    bits = 0
    ch = 0
    even = True

    while len(geohash) < precision:
        if even:
            mid = (lon_range[0] + lon_range[1]) / 2
            if longitude > mid:
                ch |= BITS[bits]
                lon_range[0] = mid
            else:
                lon_range[1] = mid
        else:
            mid = (lat_range[0] + lat_range[1]) / 2
            if latitude > mid:
                ch |= BITS[bits]
                lat_range[0] = mid
            else:
                lat_range[1] = mid

        even = not even
        if bits < 4:
            bits += 1
        else:
            geohash.append(BASE32[ch])
            bits = 0
            ch = 0

    return "".join(geohash)


def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates distance between two points in meters using Haversine formula."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def get_geohash_prefixes(geohash: str, length: int = 5) -> List[str]:
    """Returns geohash prefix for spatial clustering."""
    if len(geohash) >= length:
        return [geohash[:length]]
    return [geohash]
