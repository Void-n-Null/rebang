import { useEffect, useState } from 'react';
import { performRedirect } from './utils/redirect';
import { SearchForm } from './components/SearchForm'; // We will create this
import { Footer } from './components/Footer';         // We will create this
import { Header } from './components/Header';         // We will create this
import { Logo } from './components/Logo';             // We will create this

function App() {
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    const checkRedirect = async () => {
      const redirected = await performRedirect();
      if (!redirected) {
        setIsRedirecting(false);
      }
    };
    checkRedirect();
  }, []);

  if (isRedirecting) {
    // Optional: Show a loading spinner here if you want, 
    // or just return null to keep it blank/fast.
    return null; 
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-[#180a22] text-white">
      <div className="w-full max-w-7xl text-center p-6 md:p-10 bg-black/15 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-white/10 animate-fade-in">
        <Logo />
        <Header />
        <SearchForm />
      </div>
      <Footer />
    </div>
  );
}

export default App;


