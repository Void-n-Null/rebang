// This module contains utility functions that are used to search, filter, and sort through the bangs.

import { BangItem } from "../types/BangItem";
import { bangFilterCache, getGlobalTriggerMap } from "./bangCoreUtil";

export const MAX_FILTERED_ITEMS = 35;

/**
 * Reserved triggers for the ReBang settings/home page
 * These always point to the current origin and override any other bangs
 */
export const RESERVED_TRIGGERS = ['home', 'rebang', 'settings', 'bang', 'bangs'];

/**
 * Creates the special "home" bang that points to the current origin
 * This is dynamically generated so it works on localhost, rebang.online, etc.
 */
export function getHomeBang(): BangItem {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://rebang.online';
  return {
    t: RESERVED_TRIGGERS,
    s: 'ReBang Settings',
    d: origin.replace(/^https?:\/\//, ''),
    c: 'Online Services',
    r: 9999999, // Highest priority
    u: origin
  };
}

/**
 * Combines custom bangs with default bangs, ensuring custom bangs override defaults with the same triggers
 * Also adds a special "home" bang for ReBang settings that takes highest priority
 * 
 * @param defaultBangs Array of default bang items
 * @param customBangs Array of custom bang items that should override defaults
 * @returns Combined array with custom bangs taking precedence
 */
export function combineBangs(defaultBangs: BangItem[], customBangs: BangItem[] = []): BangItem[] {
  // Create the home bang that points to current origin
  const homeBang = getHomeBang();
  const reservedSet = new Set(RESERVED_TRIGGERS.map(t => t.toLowerCase()));

  // Create a map of custom bangs by trigger for quick lookup
  const customBangMap = new Map<string, BangItem>();
  
  // Track custom bangs by their triggers (excluding reserved triggers)
  customBangs.forEach((bang: BangItem) => {
    const triggers = Array.isArray(bang.t) ? bang.t : [bang.t];
    triggers.forEach((trigger: string) => {
      // Don't allow custom bangs to override reserved triggers
      if (!reservedSet.has(trigger.toLowerCase())) {
        customBangMap.set(trigger.toLowerCase(), bang);
      }
    });
  });

  // Filter out default bangs that have been overridden by custom bangs OR use reserved triggers
  const filteredDefaultBangs = defaultBangs.filter(bang => {
    const triggers = Array.isArray(bang.t) ? bang.t : [bang.t];
    // Exclude if any trigger is reserved or overridden by custom bang
    return !triggers.some(trigger => 
      reservedSet.has(trigger.toLowerCase()) || 
      customBangMap.has(trigger.toLowerCase())
    );
  });

  // Combine: home bang first (highest priority), then custom bangs, then defaults
  return [homeBang, ...customBangs, ...filteredDefaultBangs];
}

/**
 * Binary search to find the starting index for bangs with a given prefix
 * Takes advantage of alphabetical ordering for faster lookups
 * 
 * @param bangs Array of bangs (must be alphabetically sorted by first trigger)
 * @param prefix The prefix to search for
 * @returns The index where bangs with this prefix start, or -1 if not found
 */
function binarySearchBangPrefix(bangs: BangItem[], prefix: string): number {
    let left = 0;
    let right = bangs.length - 1;
    let result = -1;
  
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const bang = bangs[mid];
      
      // Get the effective trigger for comparison
      const trigger = Array.isArray(bang.t) ? bang.t[0] : bang.t;
      const triggerLower = trigger.toLowerCase();
      
      if (triggerLower.startsWith(prefix)) {
        // Found a match, but continue searching left to find the first occurrence
        result = mid;
        right = mid - 1;
      } else if (triggerLower < prefix) {
        // The current trigger is alphabetically before the prefix, search right
        left = mid + 1;
      } else {
        // The current trigger is alphabetically after the prefix, search left
        right = mid - 1;
      }
    }
    
    return result;
  }

  function filterAndSortByCategory(query: string, bangs: BangItem[]){
    return bangs
    .filter(bang => bang.c && bang.c.toLowerCase() === query)
    .sort((a, b) => b.r - a.r);
  }

  export function filterAndSortBangs(
    bangs: BangItem[], 
    query: string, 
    maxItems: number = MAX_FILTERED_ITEMS,
    triggerMap?: Map<string, BangItem[]>
  ): BangItem[] {
  
    // get the normalized query
    const normalizedQuery = query.toLowerCase();

    // Check cache first to avoid expensive filtering
    const cachedResults = bangFilterCache.get(normalizedQuery);
    if (cachedResults) 
      return cachedResults;
  
    // Use the provided trigger map or get the global one
    const effectiveTriggerMap = triggerMap || getGlobalTriggerMap();
    
    const categoryMatchBangs = filterAndSortByCategory(normalizedQuery, bangs);  // First, get category-matching bangs sorted by relevance
  
    const startsWithBangs = new Set<BangItem>();  // Find all bangs with triggers that start with the query
    
    if (normalizedQuery.length > 0) 
      binarySearch(bangs, normalizedQuery, startsWithBangs, effectiveTriggerMap); // Use binary search for primary triggers (optimized by alphabetical ordering)
    
    
    // Filter out bangs that are in the category matches
    const startsWithFilteredBangs = Array.from(startsWithBangs).filter(bang => 
      !categoryMatchBangs.some(catBang => {
        const catTriggers = Array.isArray(catBang.t) ? catBang.t : [catBang.t];
        const currentTriggers = Array.isArray(bang.t) ? bang.t : [bang.t];
        return catTriggers.some(catTrigger => 
          currentTriggers.includes(catTrigger)
        );
      })
    );
    
    // Create copies with the best matching trigger for display
    const startsWith = startsWithFilteredBangs.map(bang => {
      const bestTrigger = getBestMatchingTrigger(bang, normalizedQuery);
      const originalTriggers = Array.isArray(bang.t) ? bang.t : [bang.t];
      
      return {
        ...bang,
        t: bestTrigger,
        __originalT: originalTriggers
      };
    });
    
    // For the remaining matches (trigger contains query or query contains trigger),
    // we still need to scan all bangs
    const otherMatches = bangs
      .filter(bang => {
        // Skip if this bang already matches by prefix or category
        if (startsWithBangs.has(bang)) return false;
        
        // Skip category matches
        if (categoryMatchBangs.some(catBang => {
          const catTriggers = Array.isArray(catBang.t) ? catBang.t : [catBang.t];
          const currentTriggers = Array.isArray(bang.t) ? bang.t : [bang.t];
          return catTriggers.some(catTrigger => 
            currentTriggers.includes(catTrigger)
          );
        })) return false;
        
        // Check if any trigger matches the query
        return anyTriggerContainsQuery(normalizedQuery, bang);
      })
      .map(bang => {
        const bestTrigger = getBestMatchingTrigger(bang, normalizedQuery);
        const originalTriggers = Array.isArray(bang.t) ? bang.t : [bang.t];
        
        // Store a copy with the original triggers array preserved
        return {
          ...bang,
          t: bestTrigger,
          __originalT: originalTriggers
        };
      });
    
    // Combine and sort the results
    // Prefix matches get highest priority since they're most relevant
    const sortedMatches = sortMatches([...startsWith, ...otherMatches], query);
    
    // Combine the category matches with the sorted trigger matches
    // But ensure duplicates are removed by using a Set-based deduplication
    // We use a Map for deduplication to preserve insertion order, which is important for ranking
    const combinedMap = new Map();
    
    // Add category matches first (they have highest priority)
    categoryMatchBangs.forEach(bang => {
      // Use domain and service as a unique identifier (fallback to URL if no domain)
      const key = `${bang.d || bang.u}:${bang.s}`;
      if (!combinedMap.has(key)) {
        combinedMap.set(key, bang);
      }
    });
    
    // Then add sorted matches, but only if not already added by category
    sortedMatches.forEach(bang => {
      const key = `${bang.d || bang.u}:${bang.s}`;
      if (!combinedMap.has(key)) {
        combinedMap.set(key, bang);
      }
    });
    
    // Convert back to array and limit to maxItems
    const combinedBangs = Array.from(combinedMap.values());
    
    // Take the top results
    const results = combinedBangs.slice(0, maxItems);
    
    // Cache the results for future lookups
    bangFilterCache.set(normalizedQuery, results);
    
    return results;
  }

  function binarySearch(bangs: BangItem[], normalizedQuery: string, startsWithBangs: Set<BangItem>, triggerMap: Map<string, BangItem[]>) {
    const startIndex = binarySearchBangPrefix(bangs, normalizedQuery);
    if (startIndex !== -1) {
      // Collect all bangs whose first trigger starts with the query
      for (let i = startIndex; i < bangs.length; i++) {
        const bang = bangs[i];
        const firstTrigger = Array.isArray(bang.t) ? bang.t[0] : bang.t;
  
        // Stop once we reach a trigger that doesn't start with our query
        if (!firstTrigger.toLowerCase().startsWith(normalizedQuery)) {
          break;
        }
  
        startsWithBangs.add(bang);
      }
    }
  
    // For secondary triggers, we use the trigger map
    // Find all triggers that start with the query
    for (const [trigger, matchingBangs] of triggerMap.entries()) {
      if (trigger.startsWith(normalizedQuery)) {
        // Add all bangs that have this trigger
        for (const bang of matchingBangs) {
          startsWithBangs.add(bang);
        }
      }
    }
  }

  function sortMatches(matches: BangItem[], query: string): BangItem[] {
    return matches.sort((a, b) => {
      // Exact match gets highest priority
      const aExactMatch = String(a.t).toLowerCase() === query;
      const bExactMatch = String(b.t).toLowerCase() === query;
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // Starting with query gets next priority
      const aStartsWith = String(a.t).toLowerCase().startsWith(query);
      const bStartsWith = String(b.t).toLowerCase().startsWith(query);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
        // Popular services get priority
        const popularServices = ['youtube', 'google', 'wikipedia', 'amazon', 'twitter', 'reddit'];
        const aIsPopular = popularServices.some(service => a.s.toLowerCase().includes(service));
        const bIsPopular = popularServices.some(service => b.s.toLowerCase().includes(service));
        
        if (aIsPopular && !bIsPopular) return -1;
        if (!aIsPopular && bIsPopular) return 1;
        
        // Then sort by relevance score (higher r value means more relevant)
        if (a.r !== b.r) return b.r - a.r;
      
      // Finally sort alphabetically by the trigger
      return String(a.t).localeCompare(String(b.t));
    });
  }
  
  function anyTriggerContainsQuery(query: string, bang: BangItem): boolean {
    const triggers = Array.isArray(bang.t) ? bang.t : [bang.t];
    // Check if any trigger includes the query (for searching in the trigger)
    // OR if the query includes any trigger (for searching a specific trigger)
    return triggers.some(trigger => 
      trigger.toLowerCase().includes(query) || 
      query.includes(trigger.toLowerCase())
    );
  }

  function getBestMatchingTrigger(bang: BangItem, query: string): string {
    const triggers = Array.isArray(bang.t) ? bang.t : [bang.t];

    // Score function - lower is better
    const scoreMatch = (trigger: string): number => {
        const triggerLower = trigger.toLowerCase();
        
        // Exact match is best
        if (triggerLower === query) return 0;
        // Starting with query is next best
        if (triggerLower.startsWith(query)) return 1;
        // Query containing the trigger is next
        if (query.includes(triggerLower)) return 2;
        // Trigger containing the query is next
        if (triggerLower.includes(query)) return 3;
        // Otherwise, calculate a similarity score based on length difference
        return 4 + Math.abs(triggerLower.length - query.length);
    };

    // Sort triggers by match score and return the best one
    return triggers
        .sort((a, b) => scoreMatch(a) - scoreMatch(b))[0] || triggers[0];
};