import { loadSettings } from "./settings";

import { BangItem } from "../types/BangItem";
import { getParametersFromUrl, validateRedirectUrl, getBaseDomain } from "./urlUtils"; 
import { determineBangCandidate, determineBangUsed, getBangFirstTrigger, ensureFullDatabase } from "./bangCoreUtil";
import { findDefaultBangFromSettings } from "./bangSettingsUtil";

/**
 * Result object for bang redirect operations
 */
export type BangRedirectResult = {
  success: boolean;
  url?: string;
  error?: string;
  bangUsed?: string;
};


/**
 * Get the redirect URL based on the bang and query
 * Refresh settings each time to ensure we have the latest
 */
async function getRedirect(urlParams: URLSearchParams): Promise<BangRedirectResult> {
  try {
    const query = urlParams.get("q") || "";
    if (!query) return { success: false, error: "No query parameter found" };

    //Easily the fastest call here. Just a single lookup.
    const defaultBang = findDefaultBangFromSettings();

    //This function is fast. It's just a regex to extract the bang trigger.
    const bangCandidate: string = determineBangCandidate(query, defaultBang);
    
    // First attempt: Try with current loaded bangs (Top 500)
    let selectedBang: BangItem = determineBangUsed(bangCandidate, defaultBang);
    let selectedTrigger = getBangFirstTrigger(selectedBang);

    // Check if we missed the requested bang
    // If the candidate we extracted (e.g. "obscure") is different from the one we found (e.g. "g"),
    // then we failed to find the specific bang the user asked for.
    // In that case, we should load the full database and try again.
    if (bangCandidate !== selectedTrigger) {
        console.log(`Bang '!${bangCandidate}' not found in top list. Loading full database...`);
        await ensureFullDatabase();
        
        // Retry with full database
        selectedBang = determineBangUsed(bangCandidate, defaultBang);
        selectedTrigger = getBangFirstTrigger(selectedBang);
    }

    const bangName = selectedTrigger;

    // Remove the first bang from the query
    const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

    //There used to be a check here for a specific setting that defaulted to true.
    //But I couldnt find a case where anyone would want it off, so I removed it.
    //There wasnt even a way to set it in the settings page.
    if (cleanQuery === "") {
      const baseDomain = getBaseDomain(selectedBang.u);
        return { 
          success: true, 
          url: baseDomain ?? "https://www.google.com",
          bangUsed: bangName
        };
    }

    // Format the search URL, replacing template parameters
    // Supports %s (our format), {{{s}}} (DDG legacy), and {searchTerms} (OpenSearch)
    const searchUrl = selectedBang.u.replace(
      /%s|\{\{\{s\}\}\}|\{searchTerms\}/g,
      encodeURIComponent(cleanQuery)
    );
    
    // Validate the URL is safe to redirect to
    if (!searchUrl || !validateRedirectUrl(searchUrl)) {
      return { 
        success: false, 
        error: "Invalid redirect URL generated",
        bangUsed: bangName
      };
    }
    
    return { 
      success: true, 
      url: searchUrl,
      bangUsed: bangName
    };
  } catch (error) {
    console.error("Error generating redirect:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Redirect the browser to the appropriate search URL
 * This is the main function that should be used to redirect the user.
 */
export async function performRedirect(): Promise<boolean> {
  try {
    const urlParams = getParametersFromUrl(window.location.href);

    const redirect = await getRedirect(urlParams);

    if (!redirect.success || !redirect.url) return false;

    const url = redirect.url;
    
    // Benchmark: Calculate time from navigation start to now
    const now = performance.now();
    console.log(`[ReBang Benchmark] Time to calculate redirect: ${now.toFixed(2)}ms`);
    
    window.location.replace(url);
    
    return true;
  } catch (error) {
    console.error("Error performing redirect:", error);
    return false;
  }
}
