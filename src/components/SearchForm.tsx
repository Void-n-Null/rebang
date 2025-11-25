import { useState, useEffect, useRef, FormEvent } from 'react';
import { ensureFullDatabase, getCombinedBangs, hasFullDatabaseLoaded } from '../utils/bangCoreUtil';
import { filterAndSortBangs } from '../utils/bangSearchUtil';
import { performRedirect } from '../utils/redirect';
import { BangItem } from '../types/BangItem';

export function SearchForm() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<BangItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingBangs, setIsLoadingBangs] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search logic
  useEffect(() => {
    // Check if query ends with a potential bang trigger
    const bangMatch = query.match(/!([a-zA-Z0-9]*)$/);
    let isCancelled = false;
    
    if (bangMatch) {
      const bangQuery = bangMatch[1].toLowerCase();

      const updateSuggestions = () => {
        const allBangs = getCombinedBangs();
        const filtered = filterAndSortBangs(allBangs, bangQuery, 10);
        if (isCancelled) return;
        setSuggestions(filtered);
        setSelectedIndex(-1);
        setShowDropdown(true);
      };

      updateSuggestions();

      const loadFullDatabase = async () => {
        if (hasFullDatabaseLoaded()) return;
        setIsLoadingBangs(true);
        try {
          await ensureFullDatabase();
          if (!isCancelled) {
            updateSuggestions();
          }
        } finally {
          if (!isCancelled) {
            setIsLoadingBangs(false);
          }
        }
      };

      loadFullDatabase();
    } else {
      setShowDropdown(false);
      setSuggestions([]);
    }

    return () => {
      isCancelled = true;
    };
  }, [query]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      selectBang(suggestions[selectedIndex]);
    } else {
      // Normal submit
      const newUrl = `${window.location.origin}?q=${encodeURIComponent(query)}`;
      history.pushState({ query }, '', newUrl);
      performRedirect();
    }
  };

  const selectBang = (bang: BangItem) => {
    const trigger = Array.isArray(bang.t) ? bang.t[0] : bang.t;
    // Replace the last word (the partial bang) with the selected bang
    const parts = query.split(' ');
    parts.pop(); // Remove partial
    const newQuery = [...parts, `!${trigger} `].join(' ');
    
    setQuery(newQuery);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Tab') {
        e.preventDefault();
        const index = selectedIndex >= 0 ? selectedIndex : 0;
        selectBang(suggestions[index]);
    } else if (e.key === 'Enter') {
        if (selectedIndex >= 0) {
            e.preventDefault();
            selectBang(suggestions[selectedIndex]);
        }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className="w-full mt-10 pt-6 border-t border-white/10 relative">
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search with a !bang..."
          className="w-full bg-black/20 border border-white/10 rounded-xl px-6 py-4 text-lg text-white placeholder-white/30 focus:outline-none focus:border-[#3a86ff] focus:ring-1 focus:ring-[#3a86ff] transition-all shadow-inner"
          autoFocus
        />
        
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <button type="submit" className="p-2 bg-[#3a86ff] rounded-full hover:bg-[#2a76ef] transition-colors">
                <img src="/search.svg" alt="Search" className="w-5 h-5" />
            </button>
        </div>

        {showDropdown && suggestions.length > 0 && (
          <div 
            ref={dropdownRef}
            className="absolute left-0 right-0 top-full mt-2 bg-[#180a22]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[60vh] overflow-y-auto"
          >
            {suggestions.map((bang, index) => (
              <div
                key={`${bang.s}-${index}`}
                className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                  index === selectedIndex ? 'bg-[#3a86ff]/20 border-l-4 border-[#3a86ff]' : 'hover:bg-white/5 border-l-4 border-transparent'
                }`}
                onClick={() => selectBang(bang)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                    <span className="font-mono text-[#3a86ff] font-bold min-w-[3ch]">!{bang.t}</span>
                    <span className="text-white font-medium truncate">{bang.s}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/40 whitespace-nowrap">
                    <span>{bang.c}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </form>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <BangBadge name="!g" desc="Google" onClick={() => window.location.href = '/?q=!g'} />
        <BangBadge name="!yt" desc="YouTube" onClick={() => window.location.href = '/?q=!yt'} />
        <BangBadge name="!w" desc="Wikipedia" onClick={() => window.location.href = '/?q=!w'} />
        <BangBadge name="!gh" desc="GitHub" onClick={() => window.location.href = '/?q=!gh'} />
      </div>
    </div>
  );
}

function BangBadge({ name, desc, onClick }: { name: string, desc: string, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs hover:bg-white/10 hover:text-white hover:border-[#3a86ff]/50 transition-all cursor-pointer"
        >
            <span className="font-mono font-bold text-[#3a86ff] mr-1.5">{name}</span>
            {desc}
        </button>
    );
}


