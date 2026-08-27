from app.services.geo_service import encode_geohash, calculate_haversine_distance, get_geohash_prefixes


def test_geohash_encoding():
    gh = encode_geohash(12.9716, 77.5946, precision=7)
    assert len(gh) == 7
    assert isinstance(gh, str)


def test_haversine_distance():
    # Distance between two points in Bangalore ~ 220m apart
    d = calculate_haversine_distance(12.9716, 77.5946, 12.9720, 77.5960)
    assert 100.0 <= d <= 300.0


def test_geohash_prefix():
    prefixes = get_geohash_prefixes("tdr1v7x", length=5)
    assert prefixes == ["tdr1v"]
