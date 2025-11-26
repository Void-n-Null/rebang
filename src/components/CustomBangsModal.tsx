import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Pencil, Check, X, Sparkles, ExternalLink } from "lucide-react";
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
import { loadSettings, saveSettings, UserSettings } from "@/utils/settings";

interface CustomBangsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  trigger: string;
  name: string;
  url: string;
}

interface FormErrors {
  trigger?: string;
  name?: string;
  url?: string;
}

const INITIAL_FORM: FormData = { trigger: "", name: "", url: "" };

export function CustomBangsModal({ open, onOpenChange }: CustomBangsModalProps) {
  const [customBangs, setCustomBangs] = useState<BangItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [justSaved, setJustSaved] = useState<string | null>(null);
  
  const triggerInputRef = useRef<HTMLInputElement>(null);

  // Load custom bangs from settings
  useEffect(() => {
    if (open) {
      const settings = loadSettings();
      setCustomBangs(settings.customBangs || []);
      setIsCreating(false);
      setEditingId(null);
      setFormData(INITIAL_FORM);
      setErrors({});
    }
  }, [open]);

  // Focus trigger input when creating
  useEffect(() => {
    if (isCreating && triggerInputRef.current) {
      // Small delay to ensure the element is rendered
      setTimeout(() => triggerInputRef.current?.focus(), 50);
    }
  }, [isCreating]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Trigger validation
    if (!formData.trigger.trim()) {
      newErrors.trigger = "Trigger is required";
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.trigger)) {
      newErrors.trigger = "Only letters and numbers";
    } else if (formData.trigger.length > 20) {
      newErrors.trigger = "Max 20 characters";
    } else {
      // Check for duplicate (excluding current edit)
      const normalizedTrigger = formData.trigger.toLowerCase();
      const isDuplicate = customBangs.some((bang, idx) => {
        const bangId = `${bang.s}-${idx}`;
        if (editingId === bangId) return false;
        const triggers = Array.isArray(bang.t) ? bang.t : [bang.t];
        return triggers.some(t => t.toLowerCase() === normalizedTrigger);
      });
      if (isDuplicate) {
        newErrors.trigger = "Trigger already exists";
      }
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length > 50) {
      newErrors.name = "Max 50 characters";
    }

    // URL validation
    if (!formData.url.trim()) {
      newErrors.url = "URL is required";
    } else if (!formData.url.includes("%s")) {
      newErrors.url = "Must include %s placeholder";
    } else {
      try {
        const testUrl = formData.url.replace("%s", "test");
        new URL(testUrl);
      } catch {
        newErrors.url = "Invalid URL format";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const newBang: BangItem = {
      t: [formData.trigger.toLowerCase()],
      s: formData.name.trim(),
      u: formData.url.trim(),
      d: extractDomain(formData.url),
      c: "Custom",
      r: 9999, // High relevance for custom bangs
    };

    let updatedBangs: BangItem[];

    if (editingId !== null) {
      // Update existing
      const editIndex = parseInt(editingId.split("-").pop() || "0");
      updatedBangs = [...customBangs];
      updatedBangs[editIndex] = newBang;
    } else {
      // Add new
      updatedBangs = [...customBangs, newBang];
    }

    // Save to settings
    const settings = loadSettings();
    const newSettings: UserSettings = {
      ...settings,
      customBangs: updatedBangs,
    };
    saveSettings(newSettings);
    setCustomBangs(updatedBangs);

    // Show saved feedback
    const savedId = editingId || `${newBang.s}-${updatedBangs.length - 1}`;
    setJustSaved(savedId);
    setTimeout(() => setJustSaved(null), 1500);

    // Reset form
    setFormData(INITIAL_FORM);
    setIsCreating(false);
    setEditingId(null);
    setErrors({});
  };

  const handleEdit = (bang: BangItem, index: number) => {
    const trigger = Array.isArray(bang.t) ? bang.t[0] : bang.t;
    setFormData({
      trigger,
      name: bang.s,
      url: bang.u,
    });
    setEditingId(`${bang.s}-${index}`);
    setIsCreating(true);
    setErrors({});
  };

  const handleDelete = (index: number) => {
    const updatedBangs = customBangs.filter((_, i) => i !== index);
    const settings = loadSettings();
    const newSettings: UserSettings = {
      ...settings,
      customBangs: updatedBangs,
    };
    saveSettings(newSettings);
    setCustomBangs(updatedBangs);

    // Reset if editing the deleted bang
    if (editingId === `${customBangs[index].s}-${index}`) {
      setFormData(INITIAL_FORM);
      setEditingId(null);
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setFormData(INITIAL_FORM);
    setIsCreating(false);
    setEditingId(null);
    setErrors({});
  };

  const extractDomain = (url: string): string => {
    try {
      const testUrl = url.replace("%s", "test");
      const urlObj = new URL(testUrl);
      return urlObj.hostname;
    } catch {
      return "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.stopPropagation(); // Prevent dialog from closing
      handleCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            My Custom Bangs
          </DialogTitle>
          <DialogDescription>
            Create shortcuts to search any site. Use <code className="font-mono text-primary bg-primary/10 px-1 rounded">%s</code> as the search query placeholder.
          </DialogDescription>
        </DialogHeader>

        <DialogBody style={{ maxHeight: "50vh" }}>
          {/* Create/Edit Form */}
          {isCreating ? (
            <div className="mb-6 p-4 bg-secondary/30 rounded-xl border border-border/50 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">
                  {editingId ? "Edit Bang" : "New Bang"}
                </h3>
                <button
                  onClick={handleCancel}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Trigger */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">
                    Trigger (e.g., "gh" for !gh)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-mono font-semibold">
                      !
                    </span>
                    <Input
                      ref={triggerInputRef}
                      value={formData.trigger}
                      onChange={(e) =>
                        setFormData({ ...formData, trigger: e.target.value })
                      }
                      onKeyDown={handleKeyDown}
                      placeholder="trigger"
                      className={cn(
                        "pl-7 h-10 font-mono",
                        errors.trigger && "border-destructive focus:border-destructive"
                      )}
                    />
                  </div>
                  {errors.trigger && (
                    <p className="text-xs text-destructive mt-1">{errors.trigger}</p>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">
                    Service Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="e.g., GitHub"
                    className={cn(
                      "h-10",
                      errors.name && "border-destructive focus:border-destructive"
                    )}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive mt-1">{errors.name}</p>
                  )}
                </div>

                {/* URL */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">
                    Search URL (with %s placeholder)
                  </label>
                  <Input
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="https://github.com/search?q=%s"
                    className={cn(
                      "h-10 font-mono text-sm",
                      errors.url && "border-destructive focus:border-destructive"
                    )}
                  />
                  {errors.url && (
                    <p className="text-xs text-destructive mt-1">{errors.url}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="text-muted-foreground"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  {editingId ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          ) : (
            /* Add New Button */
            <button
              onClick={() => setIsCreating(true)}
              className="w-full mb-4 py-3 px-4 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Add Custom Bang</span>
            </button>
          )}

          {/* Custom Bangs List */}
          {customBangs.length > 0 ? (
            <div className="space-y-2">
              {customBangs.map((bang, index) => {
                const trigger = Array.isArray(bang.t) ? bang.t[0] : bang.t;
                const bangId = `${bang.s}-${index}`;
                const isJustSaved = justSaved === bangId;

                return (
                  <div
                    key={bangId}
                    className={cn(
                      "group relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200",
                      isJustSaved
                        ? "bg-primary/10 border-primary/50"
                        : "bg-secondary/20 border-border/30 hover:border-border/50 hover:bg-secondary/30"
                    )}
                  >
                    {/* Bang Trigger */}
                    <Badge variant="bang" className="shrink-0 font-semibold">
                      !{trigger}
                    </Badge>

                    {/* Service Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">
                          {bang.s}
                        </span>
                        {isJustSaved && (
                          <span className="text-xs text-primary animate-pulse">
                            Saved!
                          </span>
                        )}
                      </div>
                      {bang.d && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ExternalLink className="h-3 w-3" />
                          <span className="truncate">{bang.d}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(bang, index)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(index)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !isCreating ? (
            /* Empty State */
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/50 mb-3">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                No custom bangs yet
              </p>
              <p className="text-muted-foreground/70 text-xs mt-1">
                Create your first bang to search any site instantly
              </p>
            </div>
          ) : null}
        </DialogBody>

        {/* Hint Footer */}
        {customBangs.length > 0 && !isCreating && (
          <div className="px-6 py-3 border-t border-border/30 bg-secondary/20">
            <p className="text-xs text-muted-foreground text-center">
              Custom bangs appear in search suggestions and override built-in bangs
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
