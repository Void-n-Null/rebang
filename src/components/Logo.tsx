export function Logo() {
  return (
    <div className="mb-8 flex justify-center">
      <a href="/" className="block transition-transform hover:scale-105 duration-300">
        <img 
          src="/ReBangLogoSillo.png" 
          alt="ReBang Logo" 
          className="h-24 md:h-32 w-auto drop-shadow-[0_0_15px_rgba(58,134,255,0.5)]"
        />
      </a>
    </div>
  );
}


