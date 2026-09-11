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

SOURCE_FILES = [
    "leadrepo/processed_data/service_lines1.csv",
    "leadrepo/processed_data/service_lines2.csv",
]
OUTPUT_PATH = "public/data/service-lines.json"
MAX_RANGE_SPAN = 50  # safety cap; real data never exceeds 40


def build():
    out = {}
    ranges_expanded = 0

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
                    out.setdefault(key, [])
                    if entry not in out[key]:
                        out[key].append(entry)

    multi = sum(1 for v in out.values() if len(v) > 1)
    print(f"unique address keys: {len(out)}")
    print(f"addresses with multiple distinct service lines: {multi}")
    print(f"address ranges expanded: {ranges_expanded}")

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(out, f, separators=(",", ":"))

    print(f"wrote {OUTPUT_PATH} ({os.path.getsize(OUTPUT_PATH):,} bytes)")


if __name__ == "__main__":
    build()
