
import fs from 'fs';
import path from 'path';

// Read the source file
// We can't just import it because it might not be valid JS module in this context or too big
const bangContent = fs.readFileSync('./src/bang.ts', 'utf8');

// Extract the array content
// This is a bit hacky but effective for a one-off script
const match = bangContent.match(/export const bangs = (\[[\s\S]*\])/);
if (!match) {
    console.error("Could not find bangs array");
    process.exit(1);
}

// Evaluate the array safely-ish
// We use eval here because JSON.parse won't work with the unquoted keys in the source file
const bangs = eval(match[1]);

console.log(`Found ${bangs.length} bangs.`);

// Define popular triggers manually to ensure they are included
const manualTopTriggers = new Set([
    'g', 'google', 
    'yt', 'youtube', 
    'w', 'wiki', 'wikipedia',
    'r', 'reddit',
    'gh', 'github',
    'a', 'amazon',
    't', 'twitter', 'x',
    'gm', 'maps',
    'i', 'images',
    'd', 'ddg', 'duckduckgo',
    'b', 'bing',
    's', 'stackoverflow'
]);

// Filter top bangs
// Criteria: High rank OR manual list
const topBangs = bangs.filter(b => {
    const triggers = Array.isArray(b.t) ? b.t : [b.t];
    const hasTopTrigger = triggers.some(t => manualTopTriggers.has(t));
    return hasTopTrigger || b.r >= 50; // Adjust threshold as needed
});

console.log(`Selected ${topBangs.length} top bangs.`);

// Write full list to public/bangs.json
fs.writeFileSync('./public/bangs.json', JSON.stringify(bangs));
console.log('Wrote public/bangs.json');

// Write top list to src/bangs-top.ts
const topContent = `// Auto-generated top bangs for fast initial load
import { BangItem } from "./types/BangItem";

export const topBangs: BangItem[] = ${JSON.stringify(topBangs, null, 2)};
`;

fs.writeFileSync('./src/bangs-top.ts', topContent);
console.log('Wrote src/bangs-top.ts');

// Now we need to update src/bang.ts to export a loader instead of the raw data
const newBangTsContent = `
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
`;

fs.writeFileSync('./src/bang.ts', newBangTsContent);
console.log('Updated src/bang.ts');

