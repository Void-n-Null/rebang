import { useState, useEffect, useRef, FormEvent } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { ensureFullDatabase, getCombinedBangs, hasFullDatabaseLoaded } from '../utils/bangCoreUtil';
import { filterAndSortBangs } from '../utils/bangSearchUtil';
import { performRedirect } from '../utils/redirect';
import { BangItem } from '../types/BangItem';
import { Button, Badge, Input } from './ui';
import { cn } from '@/lib/utils';

export function SearchForm() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<BangItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingBangs, setIsLoadingBangs] = useState(false);
  const [maxDropdownHeight, setMaxDropdownHeight] = useState(300);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Calculate available space for dropdown
  useEffect(() => {
    const calculateMaxHeight = () => {
      if (formRef.current) {
        const formRect = formRef.current.getBoundingClientRect();
        const inputBottom = formRect.bottom;
        const viewportHeight = window.innerHeight;
        const footerBuffer = 80; // Space for footer
        const dropdownMargin = 8; // mt-2 margin
        const available = viewportHeight - inputBottom - footerBuffer - dropdownMargin;
        setMaxDropdownHeight(Math.max(150, Math.min(available, 400)));
      }
    };

    calculateMaxHeight();
    window.addEventListener('resize', calculateMaxHeight);
    return () => window.removeEventListener('resize', calculateMaxHeight);
  }, []);

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

  useEffect(() => {
    optionRefs.current = optionRefs.current.slice(0, suggestions.length);
  }, [suggestions]);

  useEffect(() => {
    if (selectedIndex >= 0 && optionRefs.current[selectedIndex]) {
      optionRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  // Search logic
  useEffect(() => {
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
      const newUrl = `${window.location.origin}?q=${encodeURIComponent(query)}`;
      history.pushState({ query }, '', newUrl);
      performRedirect();
    }
  };

  const selectBang = (bang: BangItem) => {
    const trigger = Array.isArray(bang.t) ? bang.t[0] : bang.t;
    const parts = query.split(' ');
    parts.pop();
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
    <div className="relative space-y-6">
      {/* Search input */}
      <form ref={formRef} onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type !g for Google, !yt for YouTube..."
            className="pr-14 h-14 text-base sm:text-lg bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background/80 focus:outline-none focus:ring-0 focus:ring-offset-0 shadow-none"
            autoFocus
          />
          
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Button 
              type="submit" 
              size="icon"
              className="bg-transparent border-none shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
            >
              {isLoadingBangs ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <img src="/ReBangLogoSillo.png" alt="ReBang" className="group-hover:scale-110 transition-transform duration-300 h-7 w-7" />
              )}
            </Button>
          </div>
        </div>

        {/* Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div 
            ref={dropdownRef}
            className="absolute left-0 right-0 top-full mt-2 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden z-50 overflow-y-auto scrollbar-thin"
            style={{ maxHeight: `${maxDropdownHeight}px` }}
          >
            {suggestions.map((bang, index) => {
              const trigger = Array.isArray(bang.t) ? bang.t[0] : bang.t;
              return (
                <div
                  key={`${bang.s}-${index}`}
                  ref={(el) => {
                    optionRefs.current[index] = el;
                  }}
                  className={cn(
                    "px-4 py-3 cursor-pointer flex items-center justify-between transition-colors",
                    index === selectedIndex 
                      ? "bg-primary/10 border-l-2 border-primary" 
                      : "hover:bg-secondary/50 border-l-2 border-transparent"
                  )}
                  onClick={() => selectBang(bang)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-primary font-semibold shrink-0">
                      !{trigger}
                    </span>
                    <span className="text-foreground truncate">
                      {bang.s}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {bang.c}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </form>

      {/* Quick access bangs */}
      <div className="flex flex-wrap justify-center gap-2">
        <QuickBang trigger="g" name="Google" />
        <QuickBang trigger="yt" name="YouTube" />
        <QuickBang trigger="w" name="Wikipedia" />
        <QuickBang trigger="gh" name="GitHub" />
        <QuickBang trigger="r" name="Reddit" />
      </div>
    </div>
  );
}

function QuickBang({ trigger, name }: { trigger: string; name: string }) {
  return (
    <Badge 
      variant="bang"
      className="cursor-pointer select-none"
      onClick={() => window.location.href = `/?q=!${trigger}`}
    >
      <span className="font-semibold">!{trigger}</span>
      <span className="text-muted-foreground ml-1">{name}</span>
    </Badge>
  );
}
