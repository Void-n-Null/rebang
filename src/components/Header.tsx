import { useState } from 'react';
import { Settings, HelpCircle, Plus } from 'lucide-react';
import { Button } from './ui';
import { CustomBangsModal } from './CustomBangsModal';

export function Header() {
  const [isCustomBangsOpen, setIsCustomBangsOpen] = useState(false);

  return (
    <>
      <div className="space-y-4">
        {/* Tagline */}
        <p className="text-muted-foreground text-base sm:text-lg font-light tracking-wide">
          Search with <span className="text-primary font-mono font-medium">!bangs</span> — instantly
        </p>
        
        {/* Action buttons */}
        <div className="flex items-center justify-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-muted-foreground hover:text-foreground gap-1.5"
            onClick={() => setIsCustomBangsOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">My Bangs</span>
          </Button>
          
          <div className="w-px h-4 bg-border" />
          
          <Button 
            variant="ghost" 
            size="icon"
            className="text-muted-foreground hover:text-foreground h-9 w-9"
            title="About ReBang"
            onClick={() => alert("About Modal coming soon!")}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="text-muted-foreground hover:text-foreground h-9 w-9"
            title="Settings"
            onClick={() => alert("Settings coming soon!")}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Custom Bangs Modal */}
      <CustomBangsModal 
        open={isCustomBangsOpen} 
        onOpenChange={setIsCustomBangsOpen} 
      />
    </>
  );
}
