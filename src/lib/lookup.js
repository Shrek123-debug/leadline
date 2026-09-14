// Address normalization + lookup against the bundled Chicago dataset.
// The dataset keys look like: "1034 N WELLS ST" (see scripts/build-dataset.py).
// Real people type addresses a dozen different ways, so this module's job
// is to turn whatever they typed into that same shape before searching.

const DIRECTIONS = {
  N: "N", NORTH: "N",
  S: "S", SOUTH: "S",
  E: "E", EAST: "E",
  W: "W", WEST: "W",
};

const STREET_TYPES = {
  ST: "ST", STREET: "ST",
  AVE: "AVE", AVENUE: "AVE", AV: "AVE",
  BLVD: "BLVD", BOULEVARD: "BLVD",
  DR: "DR", DRIVE: "DR",
  RD: "RD", ROAD: "RD",
  PL: "PL", PLACE: "PL",
  CT: "CT", COURT: "CT",
  PKWY: "PKWY", PARKWAY: "PKWY",
  LN: "LN", LANE: "LN",
  SQ: "SQ", SQUARE: "SQ",
  TER: "TER", TERRACE: "TER",
  HWY: "HWY", HIGHWAY: "HWY",
};

/** Strip ", Chicago IL 60610"-style suffixes if a user pastes a full address. */
function stripCityState(input) {
  return input.split(",")[0];
}

/**
 * Parse free-typed input into { num, dir, name, type } pieces.
 * Returns null if there's no leading house number — can't look that up.
 */
export function parseAddress(input) {
  const cleaned = stripCityState(input)
    .toUpperCase()
    .replace(/[.]/g, "")
    .trim();
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  const numMatch = tokens[0].match(/^(\d+)/);
  if (!numMatch) return null;
  const num = numMatch[1];

  let rest = tokens.slice(1);
  let dir = "";
  if (rest.length && DIRECTIONS[rest[0]]) {
    dir = DIRECTIONS[rest[0]];
    rest = rest.slice(1);
  }

  let type = "";
  if (rest.length && STREET_TYPES[rest[rest.length - 1]]) {
    type = STREET_TYPES[rest[rest.length - 1]];
    rest = rest.slice(0, -1);
  }

  const name = rest.join(" ");
  return { num, dir, name, type };
}

function buildKey({ num, dir, name, type }) {
  return [num, dir, name, type].filter(Boolean).join(" ").trim();
}

/**
 * Look up an address against the dataset.
 * dataset: the parsed JSON from public/data/service-lines.json
 *          (key -> array of {c,g,p,s} entries; usually length 1)
 *
 * Returns one of:
 *   { status: "found", entries: [...] }
 *   { status: "not_found", suggestions: [...] }   // nearby numbers on same street, if any
 *   { status: "invalid" }                          // couldn't even parse a house number
 */
export function lookupAddress(input, dataset) {
  const parsed = parseAddress(input);
  if (!parsed) return { status: "invalid" };

  // 1) exact match, as typed
  const exactKey = buildKey(parsed);
  if (dataset[exactKey]) {
    const rec = dataset[exactKey];
    return { status: "found", entries: rec.e, area: rec.a, matchedKey: exactKey };
  }

  // 2) retry without street type (city data is inconsistent about suffixes)
  if (parsed.type) {
    const noTypeKey = buildKey({ ...parsed, type: "" });
    const hit = Object.keys(dataset).find(
      (k) => k.startsWith(`${parsed.num} ${parsed.dir}`.trim()) && k.includes(parsed.name)
    );
    if (hit) {
      const rec = dataset[hit];
      return { status: "found", entries: rec.e, area: rec.a, matchedKey: hit };
    }
    void noTypeKey; // reserved for future fuzzy pass
  }

  // 3) offer nearby numbers on the same street as a "did you mean" list
  const streetFragment = [parsed.dir, parsed.name, parsed.type].filter(Boolean).join(" ");
  if (streetFragment) {
    const targetNum = parseInt(parsed.num, 10);
    const candidates = Object.keys(dataset)
      .filter((k) => k.endsWith(streetFragment) || k.includes(parsed.name))
      .map((k) => {
        const n = parseInt(k, 10);
        return { key: k, num: n, dist: Number.isNaN(n) ? Infinity : Math.abs(n - targetNum) };
      })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 5)
      .map((c) => c.key);

    if (candidates.length) {
      return { status: "not_found", suggestions: candidates };
    }
  }

  return { status: "not_found", suggestions: [] };
}

/** Worst-case-first ordering, used when an address has multiple recorded lines. */
const SEVERITY = { L: 3, GRR: 2, U: 1, NL: 0 };

export function worstEntry(entries) {
  return entries.slice().sort((a, b) => SEVERITY[b.c] - SEVERITY[a.c])[0];
}

export const MATERIAL_LABELS = {
  L: "Lead",
  U: "Unknown — suspected lead",
  UNL: "Unknown, but not lead",
  C: "Copper",
  GRR: "Galvanized — needs replacement",
  O: "Cast/ductile iron",
};

export const CLASS_LABELS = {
  L: "lead",
  GRR: "galvanized",
  U: "suspected",
  NL: "nonlead",
};
