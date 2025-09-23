import { createElement } from "../utils/dom";
import { UserSettings, loadSettings } from "../utils/settings";

export interface SearchInputOptions {
  onInput?: (value: string) => void;
  onSubmit?: (query: string) => void;
}

export class SearchInputComponent {
  private container: HTMLDivElement;
  private form: HTMLFormElement;
  private searchInput: HTMLInputElement;
  private settings: UserSettings;
  
  constructor(settings: UserSettings, options: SearchInputOptions = {}) {
    this.settings = settings;
    
    // Create search form with Tailwind classes
    this.form = createElement('form', { 
      id: 'search-form', 
      className: 'flex flex-col mt-4 mb-4' 
    });
    
    // Create input wrapper with integrated search button
    const inputWrapper = createElement('div', {
      className: 'relative w-full px-4'
    });
    
    // Create clickable ReBang logo on the right that acts as a submit button
    const searchButton = createElement('button', {
      type: 'submit',
      className: 'absolute right-8 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-transparent hover:scale-110 z-10'
    });
    
    // Add the ReBang logo with shadow and no background
    const logoImg = createElement('img', {
      src: '/newbang.svg',
      className: 'w-6 h-6 md:block hidden'
    });
    
    searchButton.appendChild(logoImg);
    
    // Create search input with Tailwind classes
    this.searchInput = createElement('input', {
      type: 'text',
      placeholder: 'Type your search query or !bang search',
      className: 'w-full px-4 py-2 sm:py-3 bg-black/20 hover:bg-black/30 placeholder-white/30 rounded-xl focus:bg-black/40 outline-none focus:outline-none text-white',
      autocomplete: 'off',
      spellcheck: 'false',
      autocapitalize: 'off'
    });
    
    // Add loading state indicator
    const loadingIndicator = createElement('div', {
      className: 'absolute right-14 top-1/2 transform -translate-y-1/2 opacity-0 transition-opacity duration-200',
    });
    const spinner = createElement('div', {
      className: 'w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin'
    });
    loadingIndicator.appendChild(spinner);
    
    // Assemble the search components
    inputWrapper.append(this.searchInput, searchButton, loadingIndicator);
    this.form.appendChild(inputWrapper);
    
    // Container for the whole component
    this.container = createElement('div', {});
    this.container.appendChild(this.form);
    
    // Add event listener for form submission
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      let query = this.searchInput.value.trim();
      
      // Reload settings to ensure we have the latest
      this.settings = loadSettings();
      
      // If no bang is specified and a default bang is set, prepend it
      if (!query.includes('!') && this.settings.defaultBang) {
        query = `!${this.settings.defaultBang} ${query}`;
      }
      
      if (query && options.onSubmit) {
        // Add loading state to button when form is submitted
        const button = this.form.querySelector('button');
        if (button) {
          // Replace the icon with a spinner
          button.innerHTML = '<span class="animate-spin text-white">↻</span>';
          button.disabled = true;
        }
        
        options.onSubmit(query);
      }
    });
    
    // Add input event listeners
    if (options.onInput) {
      this.searchInput.addEventListener("input", () => {
        options.onInput?.(this.searchInput.value);
      });
    }
  }
  
  public getElement(): HTMLDivElement {
    return this.container;
  }
  
  public getInputElement(): HTMLInputElement {
    return this.searchInput;
  }
  
  public getFormElement(): HTMLFormElement {
    return this.form;
  }
  
  public getValue(): string {
    return this.searchInput.value;
  }
  
  public setValue(value: string): void {
    this.searchInput.value = value;
  }
  
  public focus(): void {
    this.searchInput.focus();
  }
} 