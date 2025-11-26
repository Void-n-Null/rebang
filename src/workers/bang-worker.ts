import { BangItem } from "../types/BangItem";
import { bangs as defaultBangs, BANGS_FILENAME } from "../bang";
import { MAX_FILTERED_ITEMS, filterAndSortBangs as utilFilterAndSortBangs, combineBangs } from "../utils/bangSearchUtil";

// Cache mechanism within the worker
const workerCache = new Map<string, BangItem[]>();
const MAX_CACHE_SIZE = 50;

// Track full database state
let allBangs = defaultBangs; // Starts with Top 500
let isFullLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * Compact format types
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

async function ensureFullLoaded() {
  if (isFullLoaded) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      // Use the content-hashed filename for proper cache invalidation
      const res = await fetch(BANGS_FILENAME);
      if (!res.ok) throw new Error('Failed to fetch bangs');
      const data = await res.json();
      
      // Parse compact format if detected
      if (data.c && data.b) {
        allBangs = parseCompactBangs(data);
      } else {
        allBangs = data;
      }
      
      isFullLoaded = true;
      // Clear cache as we have new data
      workerCache.clear();
    } catch (e) {
      console.error("Worker failed to load full bangs", e);
    }
  })();
  
  return loadPromise;
}

/**
 * Filter and sort bangs based on a query
 * This is a wrapper around the utility function that adds worker-specific caching
 */
function filterAndSortBangs(
  bangs: BangItem[], 
  query: string, 
  maxItems: number = MAX_FILTERED_ITEMS
): BangItem[] {
  const normalizedQuery = query.toLowerCase();
  
  // Check cache first
  const cachedResults = workerCache.get(normalizedQuery);
  if (cachedResults) {
    return cachedResults;
  }
  
  // Use the utility function for the actual filtering and sorting
  const results = utilFilterAndSortBangs(bangs, query, maxItems);
  
  // Cache the results
  if (workerCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry (first key in the map)
    const oldestKey = workerCache.keys().next().value;
    if (oldestKey !== undefined) {
      workerCache.delete(oldestKey);
    }
  }
  workerCache.set(normalizedQuery, results);
  
  return results;
}

// Handle messages from the main thread
self.onmessage = async (e: MessageEvent) => {
  const { type, query, customBangs = [] } = e.data;
  
  if (type === 'FILTER_BANGS') {
    try {
      // Ensure we have the full database loaded
      // This might delay the first search result by ~200ms, but ensures correctness
      await ensureFullLoaded();

      // Combine custom bangs with default bangs using the utility function
      const combinedBangs = combineBangs(allBangs, customBangs);
      
      // Filter bangs based on query
      const filteredBangs = filterAndSortBangs(combinedBangs, query);
      
      // Return results to main thread
      self.postMessage({
        type: 'FILTER_RESULTS',
        results: filteredBangs,
        query: query
      });
    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        error: String(error),
        query: query
      });
    }
  } else if (type === 'CLEAR_CACHE') {
    workerCache.clear();
    self.postMessage({ type: 'CACHE_CLEARED' });
  }
}; 
