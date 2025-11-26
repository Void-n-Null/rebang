import { Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full py-6 px-4">
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <a 
            href="https://github.com/Void-n-Null/rebang" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </a>
          <span className="text-border">•</span>
          <a 
            href="/privacy" 
            className="hover:text-foreground transition-colors"
          >
            Privacy
          </a>
        </div>
        
        <p className="text-muted-foreground/60">
          © {new Date().getFullYear()} ReBang
        </p>
      </div>
    </footer>
  );
}
