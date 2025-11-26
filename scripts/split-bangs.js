#!/usr/bin/env node
/**
 * Split Bangs Script
 * 
 * Takes the compact bangs.json from update-bangs.js and:
 * 1. Extracts top bangs for inline bundling (fast initial load)
 * 2. Creates a content-hashed version for cache busting
 * 3. Sorts alphabetically for binary search optimization
 * 4. Updates src/bang.ts with the new filename and parser
 * 
 * Input format (compact):
 * {
 *   c: ["Category1", ...],           // category lookup table
 *   b: [[triggers, service, catIdx, relevance, url], ...]
 * }
 * 
 * Run this after update-bangs.js
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const publicDir = './public';

/**
 * Convert compact format to object format
 * Compact: [triggers, service, categoryIdx, relevance, url]
 */
function fromCompact(compact) {
    const { c: categories, b: bangs } = compact;
    return bangs.map(([t, s, catIdx, r, u]) => ({
        t,
        s,
        c: catIdx >= 0 ? categories[catIdx] : undefined,
        r,
        u
    }));
}

/**
 * Convert object format to compact format
 */
function toCompact(bangs, categories) {
    const categoryIndex = new Map(categories.map((c, i) => [c, i]));
    return bangs.map(b => [
        b.t,
        b.s,
        b.c ? categoryIndex.get(b.c) : -1,
        b.r,
        b.u
    ]);
}

/**
 * Get the first trigger for a bang (for sorting)
 */
function getFirstTrigger(bang) {
    const t = Array.isArray(bang) ? bang[0] : bang.t;
    return Array.isArray(t) ? t[0] : t;
}

/**
 * Read bangs from public/bangs.json (compact format)
 */
function loadBangs() {
    const simpleFile = path.join(publicDir, 'bangs.json');
    if (fs.existsSync(simpleFile)) {
        console.log(`Reading from: ${simpleFile}`);
        const data = JSON.parse(fs.readFileSync(simpleFile, 'utf8'));
        
        // Check if it's compact format or object format
        if (data.c && data.b) {
            console.log(`   Format: compact (${data.c.length} categories)`);
            return { compact: data, bangs: fromCompact(data), categories: data.c };
        } else if (Array.isArray(data)) {
            console.log(`   Format: object array`);
            const categories = [...new Set(data.map(b => b.c).filter(Boolean))].sort();
            return { compact: null, bangs: data, categories };
        }
    }
    
    // Fall back to hashed file
    const hashedFiles = fs.readdirSync(publicDir).filter(f => f.match(/^bangs\.[a-f0-9]+\.json$/));
    if (hashedFiles.length > 0) {
        const bangFile = path.join(publicDir, hashedFiles[0]);
        console.log(`Reading from: ${bangFile}`);
        const data = JSON.parse(fs.readFileSync(bangFile, 'utf8'));
        if (data.c && data.b) {
            return { compact: data, bangs: fromCompact(data), categories: data.c };
        }
        const categories = [...new Set(data.map(b => b.c).filter(Boolean))].sort();
        return { compact: null, bangs: data, categories };
    }
    
    console.error('❌ No bangs.json found in public/');
    console.error('   Run: node scripts/update-bangs.js first');
    process.exit(1);
}

const { bangs: loadedBangs, categories } = loadBangs();
let bangs = loadedBangs;
console.log(`📦 Loaded ${bangs.length} bangs`);

// Sort all bangs alphabetically by first trigger for binary search optimization
bangs.sort((a, b) => {
    const aT = getFirstTrigger(a).toLowerCase();
    const bT = getFirstTrigger(b).toLowerCase();
    return aT.localeCompare(bT);
});
console.log(`🔤 Sorted alphabetically by trigger`);

// Define popular triggers manually to ensure they are included in top bangs
const manualTopTriggers = new Set([
    'g', 'google', 
    'yt', 'youtube', 
    'w', 'wiki', 'wikipedia',
    'r', 'reddit',
    'gh', 'github',
    'a', 'amazon',
    't', 'twitter', 'x',
    'gm', 'maps', 'gmaps',
    'i', 'images', 'gi',
    'd', 'ddg', 'duckduckgo',
    'b', 'bing',
    'so', 'stackoverflow',
    'npm', 'mdn', 'crates',
    'imdb', 'rt', 'sp', 'spotify',
    'wa', 'wolfram', 'wolframalpha'
]);

// Filter top bangs: high relevance OR in manual list
const topBangs = bangs.filter(b => {
    const triggers = Array.isArray(b.t) ? b.t : [b.t];
    const hasTopTrigger = triggers.some(t => manualTopTriggers.has(t.toLowerCase()));
    return hasTopTrigger || b.r >= 50;
});

// Also sort top bangs alphabetically
topBangs.sort((a, b) => {
    const aT = getFirstTrigger(a).toLowerCase();
    const bT = getFirstTrigger(b).toLowerCase();
    return aT.localeCompare(bT);
});

console.log(`⭐ Selected ${topBangs.length} top bangs for inline bundling`);

// Convert back to compact format for output
const compactOutput = {
    c: categories,
    b: toCompact(bangs, categories)
};

// Generate content hash for cache busting
const bangsJson = JSON.stringify(compactOutput);
const contentHash = crypto.createHash('md5').update(bangsJson).digest('hex').slice(0, 8);
const bangsFilename = `bangs.${contentHash}.json`;

// Write full list to public/bangs.[hash].json first
fs.writeFileSync(path.join(publicDir, bangsFilename), bangsJson);
console.log(`Wrote public/${bangsFilename} (${(bangsJson.length / 1024).toFixed(0)} KB)`);

// Clean up old bangs*.json files in public/ (both hashed and unhashed), except the one we just wrote
const oldBangFiles = fs.readdirSync(publicDir).filter(f => 
    f.match(/^bangs(\.[a-f0-9]+)?\.json$/) && f !== bangsFilename
);
for (const oldFile of oldBangFiles) {
    fs.unlinkSync(path.join(publicDir, oldFile));
    console.log(`Removed old file: ${oldFile}`);
}

// Write top list to src/bangs-top.ts (still object format for type safety)
const topContent = `// Auto-generated top bangs for fast initial load
import { BangItem } from "./types/BangItem";

export const topBangs: BangItem[] = ${JSON.stringify(topBangs, null, 2)};
`;

fs.writeFileSync('./src/bangs-top.ts', topContent);
console.log('Wrote src/bangs-top.ts');

// Generate the bang.ts with compact format parser
const newBangTsContent = `
import { BangItem } from "./types/BangItem";
import { topBangs } from "./bangs-top";

// Export top bangs immediately for sync usage
export { topBangs };

// Content-hashed filename for cache busting
// This changes whenever the bang list is updated
export const BANGS_FILENAME = '/${bangsFilename}';

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
`;

fs.writeFileSync('./src/bang.ts', newBangTsContent);
console.log('✅ Updated src/bang.ts');

// Print summary
const totalTriggers = bangs.reduce((sum, b) => {
    const t = Array.isArray(b.t) ? b.t.length : 1;
    return sum + t;
}, 0);

console.log(`
📊 Summary:
   Total bangs: ${bangs.length}
   Total triggers: ${totalTriggers}
   Categories: ${categories.length}
   Top bangs (bundled): ${topBangs.length}
   Full file: public/${bangsFilename}
   
🚀 Ready to build! Run: npm run build
`);
