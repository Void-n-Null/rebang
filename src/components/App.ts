import { createElement } from "../utils/dom";
import { Footer } from "./Footer";
import { SearchForm } from "./SearchForm";
import { createLogo } from "./Logo";
import { createHeader } from "./Header";
import { createRecursiveJokeContainer } from "./RecursiveJokes";
import { injectGlobalAnimations } from "./animations";
import { ensureRecursiveInputStyling } from "../utils/styles";

// Import helper function from redirect.ts
import { getParametersFromUrl } from "../utils/urlUtils";

export class App {
  private container: HTMLDivElement;
  private searchForm: SearchForm;
  
  constructor() {
    // Create main container with Tailwind classes - using a more modern gradient
    this.container = createElement('div', {
      className: 'flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-[#180a22] brightness-115'
    });
    
    // Create content container with Tailwind classes - improved glass morphism effect
    const contentContainer = createElement('div', {
      className: 'w-full max-w-7xl text-center p-6 md:p-10 bg-black/15 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-white/10 opacity-0'
    });
    
    // Inject global animations once
    injectGlobalAnimations();
    
    // Logo
    const logoContainer = createLogo();
    
    // Header
    const headerContainer = createHeader();
    
    // Create search form early so we can position elements properly
    // Always use the recursive styling for the search form
    this.searchForm = new SearchForm();
    
    // Ensure recursive input styling CSS exists, then add class names to inputs
    ensureRecursiveInputStyling();
    setTimeout(() => {
      const searchInputs = document.querySelectorAll('input[type="text"]');
      searchInputs.forEach(input => {
        input.classList.add('recursive-input');
      });
    }, 300);
    
    // Check if this is a recursive mode request
    const urlParams = getParametersFromUrl(window.location.href);
    const isRecursive = urlParams.get("recursive") === "true";
    
    // Assemble the UI components
    if (isRecursive) {
      // Add recursive joke if in recursive mode
      const jokeContainer = createRecursiveJokeContainer();
      contentContainer.append(logoContainer, headerContainer, jokeContainer, this.searchForm.getElement());
    } else {
      // Standard layout
      contentContainer.append(logoContainer, headerContainer, this.searchForm.getElement());
    }
    
    // Create footer
    const footer = new Footer();
    
    // Add content container and footer to the main container
    this.container.append(contentContainer, footer.getElement());
    
    // Trigger the fade-in animation after a small delay to ensure DOM is ready
    setTimeout(() => {
      contentContainer.classList.add('fade-in');
    }, 50);
  }
  
  
  public render(rootElement: HTMLElement): void {
    // Clear the root element
    rootElement.innerHTML = '';
    
    // Append the app container
    rootElement.appendChild(this.container);
    
    // Focus the search input after a short delay to allow animation to complete
    setTimeout(() => {
      this.searchForm.focus();
    }, 300);
  }
} 