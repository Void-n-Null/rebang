
import { BangItem } from "./types/BangItem";
import { topBangs } from "./bangs-top";

// Export top bangs immediately for sync usage
export { topBangs };

// Content-hashed filename for cache busting
// This changes whenever the bang list is updated
export const BANGS_FILENAME = '/bangs.2f8c641b.json';

/**
 * Compact format structure from bangs.json:
 * {
 *   c: string[],           // category lookup table
 *   b: CompactBang[]       // [triggers, service, catIdx, relevance, url]
 * }
 */
type CompactBang = [string | string[], string, number, number, string];
interface CompactBangData {
    c: string[];
    b: CompactBang[];
}

/**
 * Parse compact format into BangItem objects
 */
function parseCompactBangs(data: CompactBangData): BangItem[] {
    const { c: categories, b: bangs } = data;
    return bangs.map(([t, s, catIdx, r, u]) => ({
        t,
        s,
        c: catIdx >= 0 ? categories[catIdx] : undefined,
        r,
        u
    }));
}

// Lazy load full bangs
export async function loadAllBangs(): Promise<BangItem[]> {
    try {
        const response = await fetch(BANGS_FILENAME);
        if (!response.ok) throw new Error('Failed to load bangs');
        const data = await response.json();
        
        // Parse compact format
        if (data.c && data.b) {
            return parseCompactBangs(data);
        }
        
        // Fallback for old object format
        return data;
    } catch (e) {
        console.error("Failed to load full bang list, falling back to top bangs", e);
        return topBangs;
    }
}

// For backward compatibility (deprecated)
export const bangs = topBangs; 
