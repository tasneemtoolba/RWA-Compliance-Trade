/**
 * Mock ENS Identity
 * Simulates ENS name resolution and avatar fetching
 */

/**
 * Reverse resolve wallet to ENS name
 */
export function reverseResolve(wallet: string): string | null {
  // For demo: return pybast.eth for certain patterns, null otherwise
  const walletLower = wallet.toLowerCase();
  
  // Return pybast.eth for wallets ending in certain patterns (demo)
  if (walletLower.endsWith("a") || walletLower.endsWith("b") || walletLower.endsWith("c")) {
    return "pybast.eth";
  }
  
  // Return other demo names for variety
  if (walletLower.endsWith("1") || walletLower.endsWith("2")) {
    return `user${walletLower.slice(-2)}.eth`;
  }
  
  return null;
}

/**
 * Get ENS avatar URL
 */
export function getAvatar(name: string): string | null {
  // For demo: return a gradient placeholder or static image
  // In production, this would fetch from ENS resolver
  
  if (name === "pybast.eth") {
    // Return profile.png for pybast.eth
    return "/profile.png";
  }
  
  // Generate a gradient avatar based on name hash
  const hash = name.split("").reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  const hue = Math.abs(hash) % 360;
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue}, 70%, 60%);stop-opacity:1" />
          <stop offset="100%" style="stop-color:hsl(${hue + 30}, 80%, 50%);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#grad)" />
      <text x="50" y="60" font-family="Arial" font-size="40" font-weight="bold" fill="white" text-anchor="middle">
        ${name[0].toUpperCase()}
      </text>
    </svg>
  `)}`;
}

/**
 * Resolve ENS name to address (forward lookup)
 */
export function resolve(name: string): string | null {
  // For demo: return a deterministic address based on name
  // In production, this would query ENS resolver
  
  if (name === "pybast.eth") {
    return "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"; // Example address
  }
  
  // Generate deterministic address from name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const hex = Math.abs(hash).toString(16).padStart(40, "0");
  return `0x${hex}`;
}
