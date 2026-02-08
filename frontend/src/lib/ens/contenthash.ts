/**
 * ENS ContentHash utilities for decentralized web
 */

export interface ContentHash {
  protocol: "ipfs" | "ipns" | "swarm" | "arweave" | "onion" | "onion3" | null;
  hash: string;
}

/**
 * Decode contenthash from bytes (simplified - real implementation would use multiformats)
 */
export function decodeContentHash(contenthash: `0x${string}`): ContentHash | null {
  if (!contenthash || contenthash === "0x") return null;
  
  // IPFS: starts with 0xe3 (ipfs) or 0xe5 (ipns)
  if (contenthash.startsWith("0xe3")) {
    // IPFS CIDv0 or CIDv1
    // Simplified - in production use multiformats library
    return {
      protocol: "ipfs",
      hash: contenthash.slice(4), // Remove 0xe3 prefix
    };
  }
  
  if (contenthash.startsWith("0xe5")) {
    return {
      protocol: "ipns",
      hash: contenthash.slice(4),
    };
  }
  
  // Add more protocol handlers as needed
  return null;
}

/**
 * Build gateway URLs for contenthash
 */
export function buildGatewayUrls(contenthash: ContentHash | null, ensName: string): string[] {
  if (!contenthash) return [];
  
  const urls: string[] = [];
  
  if (contenthash.protocol === "ipfs") {
    // IPFS gateways
    urls.push(`https://${ensName}.eth.limo`);
    urls.push(`https://${ensName}.eth.link`);
    urls.push(`https://ipfs.io/ipfs/${contenthash.hash}`);
  } else if (contenthash.protocol === "ipns") {
    urls.push(`https://${ensName}.eth.limo`);
    urls.push(`https://${ensName}.eth.link`);
  }
  
  return urls;
}
