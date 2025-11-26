import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Check, Zap, Eye, EyeOff, RotateCcw, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "./ui/dialog";
import { Button, Input, Badge } from "./ui";
import { cn } from "@/lib/utils";
import { BangItem } from "@/types/BangItem";
import { loadSettings, saveSettings, UserSettings, DEFAULT_SETTINGS } from "@/utils/settings";
import { getCombinedBangs, ensureFullDatabase, hasFullDatabaseLoaded } from "@/utils/bangCoreUtil";
import { filterAndSortBangs } from "@/utils/bangSearchUtil";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Popular default bang options for quick selection
// Using primary triggers from the database
const POPULAR_DEFAULTS = [
  { trigger: "g", name: "Google", icon: "🔍" },
  { trigger: "?", name: "DuckDuckGo", icon: "🦆" },
  { trigger: "b", name: "Bing", icon: "🅱️" },
  { trigger: "s", name: "StartPage", icon: "🔒" },
  { trigger: "brave", name: "Brave Search", icon: "🦁" },
];

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  
  // Default bang picker state
  const [showBangPicker, setShowBangPicker] = useState(false);
  const [bangSearch, setBangSearch] = useState("");
  const [bangSuggestions, setBangSuggestions] = useState<BangItem[]>([]);
  const [selectedBangIndex, setSelectedBangIndex] = useState(-1);
  const [isLoadingBangs, setIsLoadingBangs] = useState(false);
  const [currentDefaultBang, setCurrentDefaultBang] = useState<BangItem | null>(null);
  
  const bangSearchRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load settings on open
  useEffect(() => {
    if (open) {
      const loaded = loadSettings();
      setSettings(loaded);
      setHasChanges(false);
      setJustSaved(false);
      setShowBangPicker(false);
      setBangSearch("");
      
      // Find the current default bang
      const bangs = getCombinedBangs();
      const defaultBang = bangs.find(b => {
        const triggers = Array.isArray(b.t) ? b.t : [b.t];
        return triggers.some(t => t.toLowerCase() === (loaded.defaultBang || "g").toLowerCase());
      });
      setCurrentDefaultBang(defaultBang || null);
    }
  }, [open]);

  // Focus search input when picker opens
  useEffect(() => {
    if (showBangPicker && bangSearchRef.current) {
      setTimeout(() => bangSearchRef.current?.focus(), 50);
    }
  }, [showBangPicker]);

  // Search bangs
  useEffect(() => {
    if (!showBangPicker) return;
    
    let isCancelled = false;

    const updateSuggestions = () => {
      const allBangs = getCombinedBangs();
      const filtered = filterAndSortBangs(allBangs, bangSearch, 8);
      if (!isCancelled) {
        setBangSuggestions(filtered);
        setSelectedBangIndex(-1);
      }
    };

    updateSuggestions();

    // Load full database if not loaded
    const loadFull = async () => {
      if (hasFullDatabaseLoaded()) return;
      setIsLoadingBangs(true);
      try {
        await ensureFullDatabase();
        if (!isCancelled) updateSuggestions();
      } finally {
        if (!isCancelled) setIsLoadingBangs(false);
      }
    };
    loadFull();

    return () => { isCancelled = true; };
  }, [bangSearch, showBangPicker]);

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedBangIndex >= 0 && suggestionRefs.current[selectedBangIndex]) {
      suggestionRefs.current[selectedBangIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedBangIndex]);

  const handleSettingChange = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSelectDefaultBang = (bang: BangItem) => {
    const trigger = Array.isArray(bang.t) ? bang.t[0] : bang.t;
    handleSettingChange("defaultBang", trigger);
    setCurrentDefaultBang(bang);
    setShowBangPicker(false);
    setBangSearch("");
  };

  const handleQuickSelectDefault = (trigger: string) => {
    const bangs = getCombinedBangs();
    const bang = bangs.find(b => {
      const triggers = Array.isArray(b.t) ? b.t : [b.t];
      return triggers.some(t => t.toLowerCase() === trigger.toLowerCase());
    });
    if (bang) {
      handleSelectDefaultBang(bang);
    } else {
      handleSettingChange("defaultBang", trigger);
      setCurrentDefaultBang(null);
    }
  };

  const handleSave = () => {
    saveSettings(settings);
    setHasChanges(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleReset = () => {
    setSettings({ ...DEFAULT_SETTINGS });
    setCurrentDefaultBang(null);
    setHasChanges(true);
    
    // Find the default Google bang
    const bangs = getCombinedBangs();
    const googleBang = bangs.find(b => {
      const triggers = Array.isArray(b.t) ? b.t : [b.t];
      return triggers.includes("g");
    });
    if (googleBang) setCurrentDefaultBang(googleBang);
  };

  const handleBangSearchKeyDown = (e: React.KeyboardEvent) => {
    if (bangSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedBangIndex(prev => (prev + 1) % bangSuggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedBangIndex(prev => (prev - 1 + bangSuggestions.length) % bangSuggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const index = selectedBangIndex >= 0 ? selectedBangIndex : 0;
      handleSelectDefaultBang(bangSuggestions[index]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowBangPicker(false);
      setBangSearch("");
    }
  };

  const currentTrigger = settings.defaultBang || "g";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Customize how ReBang works for you
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6" style={{ maxHeight: "60vh" }}>
          {/* Default Search Engine Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">Default Search Engine</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Used when you search without a bang
                </p>
              </div>
            </div>

            {/* Current Selection */}
            <button
              onClick={() => setShowBangPicker(!showBangPicker)}
              className={cn(
                "w-full p-3 rounded-xl border transition-all duration-200 text-left",
                "flex items-center justify-between gap-3",
                showBangPicker
                  ? "border-primary bg-primary/5"
                  : "border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50"
              )}
            >
              <div className="flex items-center gap-3">
                <Badge variant="bang" className="font-semibold">
                  !{currentTrigger}
                </Badge>
                <span className="text-foreground font-medium">
                  {currentDefaultBang?.s || "Unknown"}
                </span>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                showBangPicker && "rotate-180"
              )} />
            </button>

            {/* Bang Picker Dropdown */}
            {showBangPicker && (
              <div className="rounded-xl border border-border/50 bg-card overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
                {/* Search Input */}
                <div className="p-3 border-b border-border/30">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={bangSearchRef}
                      value={bangSearch}
                      onChange={(e) => setBangSearch(e.target.value)}
                      onKeyDown={handleBangSearchKeyDown}
                      placeholder="Search for a search engine..."
                      className="pl-9 h-10 bg-secondary/30 border-border/30"
                    />
                  </div>
                </div>

                {/* Quick Picks */}
                {!bangSearch && (
                  <div className="p-3 border-b border-border/30">
                    <p className="text-xs text-muted-foreground mb-2">Popular choices</p>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_DEFAULTS.map((item) => (
                        <button
                          key={item.trigger}
                          onClick={() => handleQuickSelectDefault(item.trigger)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                            "border flex items-center gap-1.5",
                            currentTrigger === item.trigger
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/50 bg-secondary/30 text-foreground hover:bg-secondary/50 hover:border-border"
                          )}
                        >
                          <span>{item.icon}</span>
                          <span>{item.name}</span>
                          {currentTrigger === item.trigger && (
                            <Check className="h-3.5 w-3.5 ml-0.5" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Results */}
                <div className="max-h-48 overflow-y-auto scrollbar-thin">
                  {isLoadingBangs && bangSuggestions.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Loading bangs...
                    </div>
                  ) : bangSuggestions.length > 0 ? (
                    bangSuggestions.map((bang, index) => {
                      const trigger = Array.isArray(bang.t) ? bang.t[0] : bang.t;
                      const isSelected = trigger === currentTrigger;
                      return (
                        <div
                          key={`${bang.s}-${index}`}
                          ref={(el) => { suggestionRefs.current[index] = el; }}
                          onClick={() => handleSelectDefaultBang(bang)}
                          className={cn(
                            "px-4 py-2.5 cursor-pointer flex items-center justify-between transition-colors",
                            index === selectedBangIndex
                              ? "bg-primary/10"
                              : "hover:bg-secondary/50",
                            isSelected && "bg-primary/5"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-primary font-semibold text-sm">
                              !{trigger}
                            </span>
                            <span className="text-foreground text-sm">
                              {bang.s}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {bang.c}
                            </span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : bangSearch ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No bangs found for "{bangSearch}"
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </section>

          {/* Divider */}
          <div className="h-px bg-border/30" />

          {/* Redirect Loading Screen Toggle */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-foreground">Redirect Animation</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Show a brief loading screen when redirecting to search results
                </p>
              </div>
              <button
                onClick={() => handleSettingChange("showRedirectLoadingScreen", !settings.showRedirectLoadingScreen)}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors duration-200",
                  settings.showRedirectLoadingScreen
                    ? "bg-primary"
                    : "bg-secondary"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 flex items-center justify-center",
                    settings.showRedirectLoadingScreen && "translate-x-5"
                  )}
                >
                  {settings.showRedirectLoadingScreen ? (
                    <Eye className="h-3 w-3 text-primary" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-muted-foreground" />
                  )}
                </span>
              </button>
            </div>
          </section>

          {/* Divider */}
          <div className="h-px bg-border/30" />

          {/* Reset to Defaults */}
          <section>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to defaults
            </button>
          </section>
        </DialogBody>

        {/* Footer with Save */}
        <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between">
          <div className="text-sm">
            {justSaved ? (
              <span className="text-primary flex items-center gap-1.5">
                <Check className="h-4 w-4" />
                Settings saved!
              </span>
            ) : hasChanges ? (
              <span className="text-muted-foreground">Unsaved changes</span>
            ) : (
              <span className="text-muted-foreground/50">No changes</span>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="gap-1.5"
          >
            <Check className="h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

