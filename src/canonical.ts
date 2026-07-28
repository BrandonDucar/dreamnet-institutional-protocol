import { createHash } from "node:crypto";

import type { Digest, IntegrityBlock } from "./types.js";

function normalize(value: unknown, arrayEntry = false): unknown {
  if (value === undefined) {
    if (arrayEntry) return null;
    throw new Error("undefined_root_not_canonical");
  }

  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error("non_finite_number_not_canonical");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalize(entry, true));
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalize(entry)]),
    );
  }

  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(normalize(value));
}

export function sha256(value: unknown): Digest {
  const digest = createHash("sha256").update(canonicalJson(value)).digest("hex");
  return `sha256:${digest}`;
}

export function createIntegrity(value: unknown): IntegrityBlock {
  return {
    canonicalization: "dreamnet.sorted-json.v1",
    digest: sha256(value),
  };
}

export function verifyIntegrity(
  value: unknown,
  integrity: IntegrityBlock,
): boolean {
  return integrity.canonicalization === "dreamnet.sorted-json.v1"
    && sha256(value) === integrity.digest;
}

export function assertDigest(value: string, field: string): asserts value is Digest {
  if (!/^sha256:[a-f0-9]{64}$/.test(value)) {
    throw new Error(`${field}_invalid_digest`);
  }
}

export function digestFragment(digest: Digest): string {
  return digest.slice("sha256:".length, "sha256:".length + 32);
}
