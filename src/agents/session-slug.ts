const SLUG_ADJECTIVES = [
  "amber",
  "briny",
  "brisk",
  "calm",
  "clear",
  "cool",
  "crisp",
  "dawn",
  "delta",
  "ember",
  "faint",
  "fast",
  "fresh",
  "gentle",
  "glow",
  "good",
  "grand",
  "keen",
  "kind",
  "lucky",
  "marine",
  "mellow",
  "mild",
  "neat",
  "nimble",
  "nova",
  "oceanic",
  "plaid",
  "quick",
  "quiet",
  "rapid",
  "salty",
  "sharp",
  "swift",
  "tender",
  "tidal",
  "tidy",
  "tide",
  "vivid",
  "warm",
  "wild",
  "young",
];

const SLUG_NOUNS = [
  "atlas",
  "basil",
  "bison",
  "bloom",
  "breeze",
  "canyon",
  "cedar",
  "claw",
  "cloud",
  "comet",
  "coral",
  "cove",
  "crest",
  "crustacean",
  "daisy",
  "dune",
  "ember",
  "falcon",
  "fjord",
  "forest",
  "glade",
  "gulf",
  "harbor",
  "haven",
  "kelp",
  "lagoon",
  "lobster",
  "meadow",
  "mist",
  "nudibranch",
  "nexus",
  "ocean",
  "orbit",
  "otter",
  "pine",
  "prairie",
  "reef",
  "ridge",
  "river",
  "rook",
  "sable",
  "sage",
  "seaslug",
  "shell",
  "shoal",
  "shore",
  "slug",
  "summit",
  "tidepool",
  "trail",
  "valley",
  "wharf",
  "willow",
  "zephyr",
];

function secureRandomIndex(max: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

function randomChoice(values: string[], fallback: string) {
  return values[secureRandomIndex(values.length)] ?? fallback;
}

function createSlugBase(words = 2) {
  const parts = [randomChoice(SLUG_ADJECTIVES, "steady"), randomChoice(SLUG_NOUNS, "harbor")];
  if (words > 2) {
    parts.push(randomChoice(SLUG_NOUNS, "reef"));
  }
  return parts.join("-");
}

export function createSessionSlug(isTaken?: (id: string) => boolean): string {
  const isIdTaken = isTaken ?? (() => false);
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const base = createSlugBase(2);
    if (!isIdTaken(base)) {
      return base;
    }
    for (let i = 2; i <= 12; i += 1) {
      const candidate = `${base}-${i}`;
      if (!isIdTaken(candidate)) {
        return candidate;
      }
    }
  }
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const base = createSlugBase(3);
    if (!isIdTaken(base)) {
      return base;
    }
    for (let i = 2; i <= 12; i += 1) {
      const candidate = `${base}-${i}`;
      if (!isIdTaken(candidate)) {
        return candidate;
      }
    }
  }
  const randomSuffix = Array.from(crypto.getRandomValues(new Uint8Array(3)))
    .map((b) => b.toString(36))
    .join("")
    .slice(0, 5);
  const fallback = `${createSlugBase(3)}-${randomSuffix}`;
  return isIdTaken(fallback) ? `${fallback}-${Date.now().toString(36)}` : fallback;
}
