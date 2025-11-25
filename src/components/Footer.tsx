export function Footer() {
  return (
    <footer className="w-full max-w-7xl mt-12 text-center text-white/30 text-sm">
      <div className="flex justify-center items-center gap-6 mb-4">
        <a href="https://github.com/Void-n-Null/rebang" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">
          GitHub
        </a>
        <span>•</span>
        <a href="/privacy" className="hover:text-white/60 transition-colors">
          Privacy
        </a>
      </div>
      <p>© {new Date().getFullYear()} ReBang. Not affiliated with DuckDuckGo.</p>
    </footer>
  );
}


