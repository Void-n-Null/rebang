
import { BangItem } from "./types/BangItem";
import { topBangs } from "./bangs-top";

// Export top bangs immediately for sync usage
export { topBangs };

// Lazy load full bangs
export async function loadAllBangs(): Promise<BangItem[]> {
    try {
        const response = await fetch('/bangs.json');
        if (!response.ok) throw new Error('Failed to load bangs');
        const allBangs = await response.json();
        return allBangs;
    } catch (e) {
        console.error("Failed to load full bang list, falling back to top bangs", e);
        return topBangs;
    }
}

// For backward compatibility (deprecated)
// This will break anything relying on sync access to the full list
// But that's the point - we want to break that dependency
export const bangs = topBangs; 
