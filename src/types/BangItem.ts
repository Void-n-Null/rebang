/**
 * Bang item interface representing a search shortcut
 */
export interface BangItem {
  t: string[] | string;   // bang trigger/shortcut (array of shortcuts or legacy single shortcut)
  s: string;   // service name
  d?: string;  // domain (optional - some sources don't provide it)
  c?: string;  // category (optional)
  sc?: string; // subcategory (optional)
  r: number;   // relevance score
  u: string;   // url pattern with %s placeholder
  __originalT?: string[]; // original trigger array for display purposes
} 