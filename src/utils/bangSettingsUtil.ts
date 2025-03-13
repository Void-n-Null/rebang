// This module contains utility functions that are used to handle interacting with the settings in the bangs system.

import { BangItem } from "../types/BangItem";
import { loadSettings } from "./settings";
import { bangs as preDefinedBangs } from "../bang";
import { FALLBACK_BANG_TRIGGER } from "./bangCoreUtil";
import { findBang } from "./bangCoreUtil";
import { combineBangs } from "./bangSearchUtil";

export function findDefaultBangFromSettings(): BangItem {
    // First try to find the user's preferred default bang
    const userDefaultBang = findBang(loadSettings().defaultBang ?? FALLBACK_BANG_TRIGGER);

    if (userDefaultBang) 
        return userDefaultBang;
    
    // As a last resort, if Google bang isn't found, create a hardcoded fallback
    return {
      t: ["g"],
      s: "Google",
      d: "Google Search",
      u: "https://www.google.com/search?q={{{s}}}",
      r: 1000 // High relevance score
    };
  }
  


export function getCombinedBangsFromSettings(): BangItem[] {
    const settings = loadSettings();
    if (!settings.customBangs || settings.customBangs.length === 0) {
      return preDefinedBangs;
    }
  
    // Use the utility function to combine bangs
    return combineBangs(preDefinedBangs, settings.customBangs);
  }

