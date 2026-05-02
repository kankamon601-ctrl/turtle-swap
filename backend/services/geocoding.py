"""
Free geocoding via OpenStreetMap Nominatim.

No API key, no cost. Rate limit is ~1 req/sec which is fine since
we only call this on signup and profile save.

Nominatim policy requires:
  - a meaningful User-Agent identifying the app
  - not hammering the service (don't call per page load)
See: https://operations.osmfoundation.org/policies/nominatim/
"""
import requests

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
# Keep UA short + specific. Avoid placeholder domains (example.com etc.)
# as Nominatim's abuse filter 403s them.
HEADERS = {"User-Agent": "SwapHoot/1.0 (dev)"}
TIMEOUT_SECONDS = 6


def _try_query(query):
    """Run a single Nominatim search. Returns (lat, lng) or None."""
    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={"q": query, "format": "json", "limit": 1},
            headers=HEADERS,
            timeout=TIMEOUT_SECONDS,
        )
        if resp.status_code != 200:
            return None
        data = resp.json()
        if not data:
            return None
        return float(data[0]["lat"]), float(data[0]["lon"])
    except (requests.RequestException, ValueError, KeyError, IndexError):
        return None


def geocode_address(country="", city="", street="", postal_code=""):
    """
    Convert a structured address into (latitude, longitude).

    Tries progressively looser queries so that a slightly-wrong street or
    postal code still pins the user at city level:
      1. street, postal_code, city, country
      2. postal_code, city, country
      3. street, city, country
      4. city, country
      5. country
    Returns (None, None) only if none of them resolve.
    """
    country = (country or "").strip()
    city = (city or "").strip()
    street = (street or "").strip()
    postal_code = (postal_code or "").strip()

    if not any((country, city, street, postal_code)):
        return None, None

    # Build candidate queries in order of specificity (most → least)
    candidates = []
    if street and postal_code and city and country:
        candidates.append(f"{street}, {postal_code}, {city}, {country}")
    if postal_code and city and country:
        candidates.append(f"{postal_code}, {city}, {country}")
    if street and city and country:
        candidates.append(f"{street}, {city}, {country}")
    if city and country:
        candidates.append(f"{city}, {country}")
    if country:
        candidates.append(country)

    # Dedupe while preserving order
    seen = set()
    unique = []
    for q in candidates:
        if q not in seen:
            seen.add(q)
            unique.append(q)

    for query in unique:
        result = _try_query(query)
        if result is not None:
            return result

    return None, None


def build_location_label(city="", country=""):
    """Human-readable one-liner used for display (e.g. 'Chiang Mai, Thailand')."""
    parts = [p for p in (city, country) if p]
    return ", ".join(parts)
