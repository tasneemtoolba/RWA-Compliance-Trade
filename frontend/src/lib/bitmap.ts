export type Region = "EU" | "US" | "APAC" | "LATAM" | "OTHER";
export type Bucket = "100" | "1000" | "10000" | "100000" | "1000000";

/**
 * Bit layout (mask-friendly):
 * bit 0  -> accredited
 * bits 1..5 -> region flags
 * bits 10..14 -> bucket flags
 */
export function buildBitmap(opts: { accredited: boolean; region: Region; bucket: Bucket }): bigint {
  let b = 0n;

  if (opts.accredited) b |= 1n << 0n;

  const regionBit: Record<Region, bigint> = {
    EU: 1n,
    US: 2n,
    APAC: 3n,
    LATAM: 4n,
    OTHER: 5n,
  };
  b |= 1n << regionBit[opts.region];

  const bucketBit: Record<Bucket, bigint> = {
    "100": 10n,
    "1000": 11n,
    "10000": 12n,
    "100000": 13n,
    "1000000": 14n,
  };
  b |= 1n << bucketBit[opts.bucket];

  return b;
}

/** Example rule: accredited + EU + bucket=1000 */
export function defaultRuleMask(): bigint {
  const accredited = 1n << 0n;
  const eu = 1n << 1n;
  const bucket1k = 1n << 11n;
  return accredited | eu | bucket1k;
}
