#!/usr/bin/env node
/**
 * Bang List Update Script
 * 
 * Fetches bangs from DuckDuckGo and Kagi, merges them intelligently,
 * deduplicates by combining triggers, and outputs optimized JSON.
 * 
 * Usage: node scripts/update-bangs.js
 * 
 * This will:
 * 1. Fetch bangs from DuckDuckGo (bang.js)
 * 2. Fetch bangs from Kagi (GitHub)
 * 3. Normalize all bangs to a common format
 * 4. Merge duplicates (same URL pattern) into single entries with multiple triggers
 * 5. Convert {{{s}}} to %s for cleaner URLs
 * 6. Sort by relevance score
 * 7. Output to public/bangs.json (then run split-bangs.js to finalize)
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URLs for bang sources
const DUCKDUCKGO_BANG_URL = 'https://duckduckgo.com/bang.js';
const KAGI_BANG_URL = 'https://raw.githubusercontent.com/kagisearch/bangs/main/data/bangs.json';

// Output paths
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'bangs.json');

/**
 * Fetch JSON data from a URL
 */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Normalize a URL pattern:
 * - Convert {{{s}}} to %s
 * - Convert {searchTerms} to %s
 * - Normalize to https where possible
 * - Remove tracking parameters
 */
function normalizeUrl(url) {
  if (!url) return '';
  
  return url
    // Convert template placeholders to %s
    .replace(/\{\{\{s\}\}\}/g, '%s')
    .replace(/\{searchTerms\}/g, '%s')
    .replace(/\{search_term_string\}/g, '%s')
    // Upgrade http to https for known safe domains
    .replace(/^http:\/\/(www\.)?(google|youtube|wikipedia|github|reddit|amazon|twitter|duckduckgo)\./i, 'https://$1$2.')
    // Trim whitespace
    .trim();
}

/**
 * Normalize a domain for comparison
 */
function normalizeDomain(domain) {
  if (!domain) return '';
  return domain.toLowerCase().replace(/^www\./, '');
}

/**
 * Extract domain from URL if not provided
 */
function extractDomain(url) {
  if (!url) return '';
  try {
    const match = url.match(/^https?:\/\/([^\/]+)/i);
    if (match) {
      return normalizeDomain(match[1]);
    }
  } catch (e) {}
  return '';
}

/**
 * Create a unique key for a bang based on its URL pattern
 * This is used to identify duplicates that should be merged
 */
function createBangKey(bang) {
  // Normalize the URL for comparison
  const normalizedUrl = normalizeUrl(bang.u)
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '');
  
  return normalizedUrl;
}

/**
 * Normalize DuckDuckGo bang format
 */
function normalizeDdgBang(bang) {
  const url = normalizeUrl(bang.u);
  return {
    t: [bang.t], // Single trigger as array
    s: bang.s || '',
    d: normalizeDomain(bang.d) || extractDomain(url),
    c: bang.c || null,
    sc: bang.sc || null,
    r: bang.r || 0,
    u: url,
    _source: 'ddg'
  };
}

/**
 * Normalize Kagi bang format
 * Kagi has 't' for primary trigger and 'ts' for additional triggers
 */
function normalizeKagiBang(bang) {
  const triggers = [bang.t];
  if (bang.ts && Array.isArray(bang.ts)) {
    triggers.push(...bang.ts);
  }
  
  const url = normalizeUrl(bang.u);
  return {
    t: triggers,
    s: bang.s || '',
    d: normalizeDomain(bang.d) || extractDomain(url),
    c: bang.c || null,
    sc: bang.sc || null,
    r: bang.r || 0, // Kagi doesn't have relevance, default to 0
    u: url,
    _source: 'kagi'
  };
}

/**
 * Merge two bang entries into one
 * Combines triggers and takes the best metadata
 */
function mergeBangs(existing, newBang) {
  // Combine triggers, removing duplicates
  const allTriggers = new Set([...existing.t, ...newBang.t]);
  
  // Take the higher relevance score
  const relevance = Math.max(existing.r || 0, newBang.r || 0);
  
  // Prefer non-empty values for metadata
  const service = existing.s || newBang.s;
  const category = existing.c || newBang.c;
  const subcategory = existing.sc || newBang.sc;
  
  // Prefer the URL that's already https
  let url = existing.u;
  if (newBang.u.startsWith('https://') && !existing.u.startsWith('https://')) {
    url = newBang.u;
  }
  
  // Track sources
  const sources = new Set();
  if (existing._source) sources.add(existing._source);
  if (newBang._source) sources.add(newBang._source);
  
  return {
    t: Array.from(allTriggers),
    s: service,
    d: existing.d || newBang.d,
    c: category,
    sc: subcategory,
    r: relevance,
    u: url,
    _source: Array.from(sources).join('+')
  };
}

/**
 * Process and merge all bangs from multiple sources
 */
function processBangs(ddgBangs, kagiBangs) {
  console.log(`Processing ${ddgBangs.length} DDG bangs and ${kagiBangs.length} Kagi bangs...`);
  
  // Map to store merged bangs by URL key
  const bangMap = new Map();
  
  // Also track bangs by trigger to handle same-trigger-different-url cases
  const triggerMap = new Map();
  
  // Process DuckDuckGo bangs first (they have relevance scores)
  for (const raw of ddgBangs) {
    if (!raw.u || !raw.t) continue; // Skip invalid entries
    
    const bang = normalizeDdgBang(raw);
    const key = createBangKey(bang);
    
    if (bangMap.has(key)) {
      bangMap.set(key, mergeBangs(bangMap.get(key), bang));
    } else {
      bangMap.set(key, bang);
    }
  }
  
  // Process Kagi bangs
  for (const raw of kagiBangs) {
    if (!raw.u || !raw.t) continue;
    
    const bang = normalizeKagiBang(raw);
    const key = createBangKey(bang);
    
    if (bangMap.has(key)) {
      bangMap.set(key, mergeBangs(bangMap.get(key), bang));
    } else {
      bangMap.set(key, bang);
    }
  }
  
  // Convert map to array and clean up
  const bangs = Array.from(bangMap.values()).map(bang => {
    // Sort triggers: shortest first (most likely to be typed)
    const sortedTriggers = bang.t.sort((a, b) => a.length - b.length);
    
    // Remove internal tracking fields
    const { _source, ...cleanBang } = bang;
    
    return {
      ...cleanBang,
      t: sortedTriggers.length === 1 ? sortedTriggers[0] : sortedTriggers
    };
  });
  
  // Sort by relevance (highest first), then alphabetically by first trigger
  bangs.sort((a, b) => {
    if (b.r !== a.r) return b.r - a.r;
    const aT = Array.isArray(a.t) ? a.t[0] : a.t;
    const bT = Array.isArray(b.t) ? b.t[0] : b.t;
    return aT.localeCompare(bT);
  });
  
  return bangs;
}

/**
 * Remove null/undefined values from objects
 */
function cleanBang(bang) {
  const cleaned = {};
  for (const [key, value] of Object.entries(bang)) {
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Convert bangs to compact array format with lookup tables
 * 
 * Output format:
 * {
 *   c: ["Category1", "Category2", ...],  // category lookup table
 *   b: [                                  // bangs as arrays
 *     [triggers, service, categoryIndex, relevance, url],
 *     ...
 *   ]
 * }
 * 
 * This saves ~30-40% file size by:
 * - Removing repeated key names ("t", "s", "c", "r", "u")
 * - Using category index instead of repeated strings
 * - Removing domain (can be extracted from URL)
 * - Removing subcategory (unused in app)
 */
function toCompactFormat(bangs) {
  // Build category lookup table
  const categories = [...new Set(bangs.map(b => b.c).filter(Boolean))].sort();
  const categoryIndex = new Map(categories.map((c, i) => [c, i]));
  
  // Convert bangs to arrays: [triggers, service, categoryIdx, relevance, url]
  const compactBangs = bangs.map(b => {
    const catIdx = b.c ? categoryIndex.get(b.c) : -1;
    return [
      b.t,      // 0: trigger(s)
      b.s,      // 1: service name
      catIdx,   // 2: category index (-1 if none)
      b.r,      // 3: relevance score
      b.u       // 4: URL pattern
    ];
  });
  
  return {
    c: categories,  // category lookup
    b: compactBangs // bang data
  };
}

/**
 * Convert compact format back to object format (for compatibility)
 * This is used client-side to restore the full object structure
 */
function fromCompactFormat(compact) {
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
 * Generate statistics about the bang list
 */
function generateStats(bangs) {
  const stats = {
    total: bangs.length,
    withMultipleTriggers: 0,
    totalTriggers: 0,
    categories: new Map(),
    topByRelevance: []
  };
  
  for (const bang of bangs) {
    const triggers = Array.isArray(bang.t) ? bang.t : [bang.t];
    stats.totalTriggers += triggers.length;
    if (triggers.length > 1) stats.withMultipleTriggers++;
    
    if (bang.c) {
      stats.categories.set(bang.c, (stats.categories.get(bang.c) || 0) + 1);
    }
  }
  
  // Top 10 by relevance
  stats.topByRelevance = bangs
    .slice(0, 10)
    .map(b => `!${Array.isArray(b.t) ? b.t[0] : b.t} (${b.s}, r=${b.r})`);
  
  return stats;
}

/**
 * Main function
 */
async function main() {
  console.log('🔄 Starting bang list update...\n');
  
  // Fetch from both sources in parallel
  console.log('📥 Fetching from DuckDuckGo and Kagi...');
  
  let ddgBangs = [];
  let kagiBangs = [];
  
  try {
    [ddgBangs, kagiBangs] = await Promise.all([
      fetchJson(DUCKDUCKGO_BANG_URL).catch(e => {
        console.warn(`⚠️  Failed to fetch DDG bangs: ${e.message}`);
        return [];
      }),
      fetchJson(KAGI_BANG_URL).catch(e => {
        console.warn(`⚠️  Failed to fetch Kagi bangs: ${e.message}`);
        return [];
      })
    ]);
  } catch (e) {
    console.error('❌ Failed to fetch bang data:', e.message);
    process.exit(1);
  }
  
  console.log(`   DDG: ${ddgBangs.length} bangs`);
  console.log(`   Kagi: ${kagiBangs.length} bangs\n`);
  
  if (ddgBangs.length === 0 && kagiBangs.length === 0) {
    console.error('❌ No bangs fetched from any source!');
    process.exit(1);
  }
  
  // Process and merge
  console.log('🔀 Merging and deduplicating...');
  const bangs = processBangs(ddgBangs, kagiBangs);
  
  // Clean up null values
  const cleanedBangs = bangs.map(cleanBang);
  
  // Generate stats
  const stats = generateStats(cleanedBangs);
  console.log(`\n📊 Statistics:`);
  console.log(`   Total unique bangs: ${stats.total}`);
  console.log(`   Total triggers: ${stats.totalTriggers}`);
  console.log(`   Bangs with multiple triggers: ${stats.withMultipleTriggers}`);
  console.log(`   Triggers saved by merging: ${stats.totalTriggers - stats.total}`);
  console.log(`\n   Top categories:`);
  const sortedCategories = Array.from(stats.categories.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  for (const [cat, count] of sortedCategories) {
    console.log(`     ${cat}: ${count}`);
  }
  console.log(`\n   Top by relevance:`);
  for (const item of stats.topByRelevance) {
    console.log(`     ${item}`);
  }
  
  // Write output
  console.log(`\n💾 Writing to ${OUTPUT_FILE}...`);
  
  // Ensure directory exists
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }
  
  // Convert to compact format for smaller file size
  const compactData = toCompactFormat(cleanedBangs);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(compactData));
  
  const fileSize = fs.statSync(OUTPUT_FILE).size;
  const originalSize = JSON.stringify(cleanedBangs).length;
  const savings = ((1 - fileSize / originalSize) * 100).toFixed(0);
  console.log(`   File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB (${savings}% smaller than object format)`);
  
  console.log('\n✅ Bang list updated successfully!');
  console.log('\n📝 Next steps:');
  console.log('   Run: node scripts/split-bangs.js');
  console.log('   This will generate the hashed file and update src/bang.ts\n');
}

// Run
main().catch(e => {
  console.error('❌ Fatal error:', e);
  process.exit(1);
});

