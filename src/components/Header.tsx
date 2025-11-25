import { useState } from 'react';
// We'll implement the modals later
// import { AboutModal } from './AboutModal';
// import { SettingsModal } from './SettingsModal';
// import { CustomBangsModal } from './CustomBangsModal';

export function Header() {
  return (
    <div className="mb-6 flex flex-col items-center">
      <h2 className="text-white text-lg sm:text-xl md:text-2xl font-light text-center tracking-wider">
        Start Searching with a !Bang
      </h2>
      
      <div className="flex items-center justify-between w-full mt-2 px-4">
        <button 
          className="text-white/50 hover:text-white/90 transition-colors px-3 py-1 rounded-full hover:bg-white/10 flex items-center gap-1"
          onClick={() => alert("Custom Bangs coming soon in React rewrite!")}
        >
          My Bangs <span>+</span>
        </button>
        
        <div className="flex items-center gap-2">
          <button 
            className="text-white/50 hover:text-white/90 transition-colors w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 font-bold text-xl"
            title="About !ReBang"
            onClick={() => alert("About Modal coming soon!")}
          >
            ?
          </button>
          <button 
            className="text-white/50 hover:text-white/90 transition-colors w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10"
            title="Settings"
            onClick={() => alert("Settings coming soon!")}
          >
            <img src="/gear-black.svg" alt="Settings" className="w-6 h-6 opacity-80 filter invert" />
          </button>
        </div>
      </div>
    </div>
  );
}


