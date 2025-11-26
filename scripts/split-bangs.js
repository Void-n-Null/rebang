
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Read bangs from public/bangs.json (or any bangs.*.json file)
// This script is designed to be re-run when you pull new bangs from DuckDuckGo
const publicDir = './public';
let bangs;

// First, try to find an existing bangs file (either bangs.json or bangs.[hash].json)
const existingBangFiles = fs.readdirSync(publicDir).filter(f => f.match(/^bangs(\.[a-f0-9]+)?\.json$/));
if (existingBangFiles.length > 0) {
    // Use the first matching file
    const bangFile = path.join(publicDir, existingBangFiles[0]);
    console.log(`Reading bangs from: ${bangFile}`);
    bangs = JSON.parse(fs.readFileSync(bangFile, 'utf8'));
} else {
    // Fallback: try to read from src/bang.ts (original format)
    console.log('No existing bangs.json found, trying src/bang.ts...');
    const bangContent = fs.readFileSync('./src/bang.ts', 'utf8');
    const match = bangContent.match(/export const bangs = (\[[\s\S]*\])/);
    if (!match) {
        console.error("Could not find bangs array in src/bang.ts or public/bangs.json");
        console.error("Please place your bangs JSON file in public/bangs.json");
        process.exit(1);
    }
    // Evaluate the array safely-ish
    bangs = eval(match[1]);
}

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

// Generate content hash for cache busting
const bangsJson = JSON.stringify(bangs);
const contentHash = crypto.createHash('md5').update(bangsJson).digest('hex').slice(0, 8);
const bangsFilename = `bangs.${contentHash}.json`;

// Write full list to public/bangs.[hash].json first
fs.writeFileSync(path.join(publicDir, bangsFilename), bangsJson);
console.log(`Wrote public/${bangsFilename}`);

// Clean up old bangs*.json files in public/ (both hashed and unhashed), except the one we just wrote
const oldBangFiles = fs.readdirSync(publicDir).filter(f => 
    f.match(/^bangs(\.[a-f0-9]+)?\.json$/) && f !== bangsFilename
);
for (const oldFile of oldBangFiles) {
    fs.unlinkSync(path.join(publicDir, oldFile));
    console.log(`Removed old file: ${oldFile}`);
}

// Write top list to src/bangs-top.ts
const topContent = `// Auto-generated top bangs for fast initial load
import { BangItem } from "./types/BangItem";

export const topBangs: BangItem[] = ${JSON.stringify(topBangs, null, 2)};
`;

fs.writeFileSync('./src/bangs-top.ts', topContent);
console.log('Wrote src/bangs-top.ts');

// Now we need to update src/bang.ts to export a loader instead of the raw data
// The filename includes a content hash for cache busting
const newBangTsContent = `
import { BangItem } from "./types/BangItem";
import { topBangs } from "./bangs-top";

// Export top bangs immediately for sync usage
export { topBangs };

// Content-hashed filename for cache busting
// This changes whenever the bang list is updated
export const BANGS_FILENAME = '/${bangsFilename}';

// Lazy load full bangs
export async function loadAllBangs(): Promise<BangItem[]> {
    try {
        const response = await fetch(BANGS_FILENAME);
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

