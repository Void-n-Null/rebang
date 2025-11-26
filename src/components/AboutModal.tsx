import { ExternalLink, Github, Zap, Search, Sparkles, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "./ui/dialog";
import { cn } from "@/lib/utils";

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FAQ_ITEMS = [
  {
    q: "What's a bang?",
    a: "A bang is a shortcut that starts with ! and redirects your search to a specific site. Type !yt cats to search YouTube for cats, or !w pizza to look up pizza on Wikipedia.",
  },
  {
    q: "How do I use ReBang?",
    a: "Set ReBang as your browser's default search engine, then search normally. Include a bang anywhere in your query to redirect to that site.",
  },
  {
    q: "What if I search without a bang?",
    a: "You'll be redirected to your default search engine (Google by default). Change this in Settings.",
  },
  {
    q: "Can I create my own bangs?",
    a: "Yes! Click \"My Bangs\" to create custom shortcuts to any website. Your custom bangs override built-in ones.",
  },
  {
    q: "Is this private?",
    a: "ReBang runs entirely in your browser. No searches are logged or sent to any server. Your settings stay in your browser's local storage.",
  },
  {
    q: "Where do the bangs come from?",
    a: "We combine bangs from DuckDuckGo and Kagi, merging duplicates and updating monthly via GitHub Actions.",
  },
];

export function AboutModal({ open, onOpenChange }: AboutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img src="/ReBangLogoSillo.png" alt="" className="h-6 w-6" />
            About ReBang
          </DialogTitle>
          <DialogDescription>
            Fast bang redirects with custom shortcuts
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6" style={{ maxHeight: "60vh" }}>
          {/* What is ReBang */}
          <section className="space-y-3">
            <p className="text-sm text-foreground leading-relaxed">
              <strong>ReBang</strong> lets you search any site instantly using bang shortcuts. 
              Type <code className="text-primary bg-primary/10 px-1 rounded">!g</code> for Google, 
              {" "}<code className="text-primary bg-primary/10 px-1 rounded">!yt</code> for YouTube, 
              or create your own for any site you use.
            </p>
            
            {/* Quick highlights */}
            <div className="grid grid-cols-2 gap-2">
              <FeatureChip icon={Zap} label="Instant redirects" />
              <FeatureChip icon={Sparkles} label="Custom bangs" />
              <FeatureChip icon={Search} label="14,000+ bangs" />
              <FeatureChip icon={Shield} label="100% private" />
            </div>
          </section>

          {/* Divider */}
          <div className="h-px bg-border/30" />

          {/* FAQ */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Common Questions</h3>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item, i) => (
                <FAQItem key={i} question={item.q} answer={item.a} />
              ))}
            </div>
          </section>

          {/* Divider */}
          <div className="h-px bg-border/30" />

          {/* Setup tip */}
          <section className="p-3 rounded-xl bg-primary/5 border border-primary/20">
            <h4 className="text-sm font-medium text-foreground mb-1">Quick Setup</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Add <code className="text-primary bg-primary/10 px-1 rounded text-[11px]">rebang.online/?q=%s</code> as 
              a custom search engine in your browser and set it as default.
            </p>
          </section>

          {/* Links */}
          <section className="flex items-center justify-center gap-4 pt-2">
            <a
              href="https://github.com/Void-n-Null/rebang"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-border">•</span>
            <a
              href="https://github.com/t3dotgg/unduck"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Based on unduck</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </section>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function FeatureChip({ icon: Icon, label }: { icon: typeof Zap; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 border border-border/30">
      <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
      <span className="text-xs text-foreground">{label}</span>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="space-y-1">
      <h4 className="text-sm font-medium text-foreground">{question}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{answer}</p>
    </div>
  );
}

