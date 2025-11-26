import { SearchForm } from './components/SearchForm';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Logo } from './components/Logo';

/**
 * Main App component - only rendered when NOT redirecting
 * Redirect logic is handled in main.tsx BEFORE React loads
 */
function App() {
  return (
    <div className="mesh-gradient grain h-screen flex flex-col overflow-hidden">
      {/* Main content area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 min-h-0">
        <div className="w-full max-w-2xl flex flex-col min-h-0">
          {/* Hero section with logo and header */}
          <div className="text-center mb-6 sm:mb-8 animate-fade-up shrink-0">
            <Logo />
            <Header />
          </div>
          
          {/* Search section with glass card effect */}
          <div 
            className="relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-6 sm:p-8 shadow-2xl animate-fade-up shrink-0"
            style={{ animationDelay: '100ms' }}
          >
            {/* Subtle gradient border glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
            
            <SearchForm />
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
