"""
build-dataset.py
-----------------
Builds public/data/service-lines.json from the Chicago lead service line
inventory, as cleaned and geocoded by Inside Climate News, WBEZ, and Grist:
https://github.com/InsideClimateNews/2025-08-chicago-lead-service-lines

Source data underneath: City of Chicago Dept. of Water Management service
line inventory submitted to the Illinois EPA, April 14, 2025.

USAGE:
  1) Clone the source repo alongside this project:
       git clone https://github.com/InsideClimateNews/2025-08-chicago-lead-service-lines.git leadrepo
  2) Run:  python3 scripts/build-dataset.py
  3) Output lands at public/data/service-lines.json

WHAT THIS DOES:
  - Reads processed_data/service_lines1.csv and service_lines2.csv
  - Drops intersection-only records (no street number to search by)
  - Builds a normalized "NUM DIR NAME TYPE" key matching how the app
    normalizes user-typed addresses (see src/lib/lookup.js)
  - Expands the handful of address RANGES (e.g. "600-604 N WELLS ST") into
    every individual number in the range, so a resident's exact address
    matches even if the city only logged the building as a range. There
    are just 21 of these citywide, max span 40 numbers, so this is cheap.
  - Keeps MULTIPLE distinct service lines per address as a list rather
    than silently overwriting one with another. ~1,700 addresses citywide
    have more than one line on record (typically multi-unit buildings).

Each entry stores four short-coded fields to keep the file small:
  c = classification_for_entire_service_line   (L / GRR / U / NL)
  g = gooseneck_pigtail material code
  p = pws_owned_service_line_material code       (public/utility side)
  s = customer_side_service_line_material code   (private side)

Material codes (from the source repo's README):
  L   = Lead
  U   = Unknown (suspected lead)
  UNL = Unknown, but not lead
  C   = Copper
  GRR = Galvanized requiring replacement
  O   = Cast/ductile iron or transite
"""

import csv
import json
import os
from shapely.geometry import shape, Point

SOURCE_FILES = [
    "leadrepo/processed_data/service_lines1.csv",
    "leadrepo/processed_data/service_lines2.csv",
]
COMMUNITY_GEOJSON = "leadrepo/processed_data/chicago_community_areas.geojson"
OUTPUT_PATH = "public/data/service-lines.json"
STATS_OUTPUT_PATH = "public/data/community-stats.json"
MAX_RANGE_SPAN = 50  # safety cap; real data never exceeds 40


def load_community_polygons():
    """Load the 77 community area polygons + their pre-computed stats."""
    gj = json.load(open(COMMUNITY_GEOJSON))
    areas = []  # list of (area_num:int, name:str, shapely_polygon, stats:dict)
    stats_by_num = {}
    for feat in gj["features"]:
        props = feat["properties"]
        area_num = int(props["area_num_1"])
        poly = shape(feat["geometry"])
        areas.append((area_num, props["community"], poly))
        stats_by_num[area_num] = {
            "name": props["community"],
            "pctRequiresReplacement": round(props["pct_requires_replacement"], 1),
            "pctLead": round(props["pct_lead"], 1),
            "pctSuspected": round(props["pct_suspected_lead"], 1),
            "pctPoverty": round(props["pct_poverty"], 1),
            "medianIncome": round(props["median_household_income"]),
            "pctMinority": round(props["pct_minority"], 1),
        }
    return areas, stats_by_num


def find_area_num(areas, lat, lon):
    """Point-in-polygon: which community area contains this coordinate?"""
    pt = Point(lon, lat)  # shapely wants (x, y) = (lon, lat)
    for area_num, _name, poly in areas:
        if poly.contains(pt):
            return area_num
    # fall back to nearest polygon if the point sits just outside every
    # boundary (can happen right on a coastline / edge due to rounding)
    best_num, best_dist = None, float("inf")
    for area_num, _name, poly in areas:
        d = poly.distance(pt)
        if d < best_dist:
            best_dist, best_num = d, area_num
    return best_num


def build():
    areas, stats_by_num = load_community_polygons()
    print(f"loaded {len(areas)} community area polygons")

    out = {}
    ranges_expanded = 0
    area_cache = {}  # (rounded_lat, rounded_lon) -> area_num, avoids re-testing
    # points that are extremely close together against all 77 polygons every time

    for fname in SOURCE_FILES:
        with open(fname, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                if row["is_intersection"] == "TRUE":
                    continue

                stnum1 = row["m_stnum1"] or row["stnum1"]
                stnum2 = row["m_stnum2"] or row["stnum2"] or stnum1
                stdir = (row["m_stdir"] or row["stdir"] or "").strip()
                stname = (row["m_stname"] or row["stname"] or "").strip()
                sttype = (row["m_sttype"] or row["sttype"] or "").strip()

                if not stnum1 or not stname:
                    continue

                entry = {
                    "c": row["classification_for_entire_service_line"],
                    "g": row["gooseneck_pigtail"],
                    "p": row["pws_owned_service_line_material"],
                    "s": row["customer_side_service_line_material"],
                }

                # Spatial join: find this address's community area, cached
                # by rounded coordinate since duplicate addresses share a point.
                area_num = None
                try:
                    lat, lon = float(row["lat"]), float(row["long"])
                    cache_key = (round(lat, 5), round(lon, 5))
                    if cache_key not in area_cache:
                        area_cache[cache_key] = find_area_num(areas, lat, lon)
                    area_num = area_cache[cache_key]
                except (ValueError, TypeError):
                    pass

                nums = [stnum1]
                try:
                    n1, n2 = int(stnum1), int(stnum2)
                    if n2 > n1 and (n2 - n1) <= MAX_RANGE_SPAN:
                        nums = [str(n) for n in range(n1, n2 + 1)]
                        if len(nums) > 1:
                            ranges_expanded += 1
                except ValueError:
                    pass

                for num in nums:
                    key = f"{num} {stdir} {stname} {sttype}".upper()
                    key = " ".join(key.split())
                    if key not in out:
                        out[key] = {"a": area_num, "e": []}
                    if entry not in out[key]["e"]:
                        out[key]["e"].append(entry)

    multi = sum(1 for v in out.values() if len(v["e"]) > 1)
    unmatched = sum(1 for v in out.values() if v["a"] is None)
    print(f"unique address keys: {len(out)}")
    print(f"addresses with multiple distinct service lines: {multi}")
    print(f"address ranges expanded: {ranges_expanded}")
    print(f"addresses with no coordinate / community match: {unmatched}")

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    print(f"wrote {OUTPUT_PATH} ({os.path.getsize(OUTPUT_PATH):,} bytes)")

    # Citywide averages, for "your neighborhood vs. the city" comparisons.
    all_areas = list(stats_by_num.values())
    citywide = {
        "pctRequiresReplacement": round(sum(a["pctRequiresReplacement"] for a in all_areas) / len(all_areas), 1),
        "pctLead": round(sum(a["pctLead"] for a in all_areas) / len(all_areas), 1),
    }
    stats_output = {"areas": stats_by_num, "citywide": citywide}
    with open(STATS_OUTPUT_PATH, "w") as f:
        json.dump(stats_output, f, separators=(",", ":"))
    print(f"wrote {STATS_OUTPUT_PATH} ({os.path.getsize(STATS_OUTPUT_PATH):,} bytes)")


if __name__ == "__main__":
    build()
