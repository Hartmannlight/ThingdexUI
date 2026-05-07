import type { ParsedScan } from "@/scanner/types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const parseScan = (input: string): ParsedScan => {
  const raw = input.trim();
  const prefixed = raw.match(/^TDX:(I|L|T):(.+)$/i);

  if (prefixed) {
    const id = prefixed[2].trim();
    if (prefixed[1].toUpperCase() === "I") return { kind: "item", id, raw };
    if (prefixed[1].toUpperCase() === "L") return { kind: "location", id, raw };
    return { kind: "item_type", id, raw };
  }

  if (uuidPattern.test(raw)) {
    return { kind: "unknown", raw };
  }

  return { kind: "unknown", raw };
};
