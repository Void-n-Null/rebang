import { ShieldCheck, ArrowRight, Server, Eye, EyeOff, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "./ui/dialog";

interface PrivacyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyModal({ open, onOpenChange }: PrivacyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Privacy
          </DialogTitle>
          <DialogDescription>
            How ReBang handles your data
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5" style={{ maxHeight: "60vh" }}>
          {/* Zero Logging */}
          <PrivacyPoint
            icon={EyeOff}
            title="Zero Logging"
            description="ReBang does not log, store, or transmit your searches. There's no analytics, no tracking pixels, no server logs. We literally can't see what you search for."
            variant="good"
          />

          {/* Client-Side Redirects */}
          <PrivacyPoint
            icon={ArrowRight}
            title="Client-Side Redirects"
            description="All redirects happen entirely in your browser. Your search query goes directly from your browser to the destination site—it never passes through any ReBang server."
            variant="good"
          />

          {/* No Server Processing */}
          <PrivacyPoint
            icon={Server}
            title="Static Site Only"
            description="ReBang is a static website. There's no backend server processing your requests. The site loads once, then everything runs locally in your browser."
            variant="good"
          />

          {/* Local Storage */}
          <PrivacyPoint
            icon={Eye}
            title="Local Storage"
            description="Your settings and custom bangs are stored in your browser's localStorage. This data never leaves your device and is only accessible to you."
            variant="good"
          />

          {/* Divider */}
          <div className="h-px bg-border/30" />

          {/* Disclaimer */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-foreground">Once you leave ReBang</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  ReBang is a middleman that gets you from point A to point B. Once you're redirected to your destination (Google, YouTube, etc.), that site's privacy policy applies. We can't control or guarantee how those sites handle your data.
                </p>
              </div>
            </div>
          </div>

          {/* TL;DR */}
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">TL;DR:</strong> We see nothing. We store nothing. We send nothing.
            </p>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function PrivacyPoint({ 
  icon: Icon, 
  title, 
  description,
  variant = "good"
}: { 
  icon: typeof ShieldCheck; 
  title: string; 
  description: string;
  variant?: "good" | "warning";
}) {
  return (
    <div className="flex gap-3">
      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        variant === "good" 
          ? "bg-primary/10 text-primary" 
          : "bg-amber-500/10 text-amber-500"
      }`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

