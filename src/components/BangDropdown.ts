import { createElement } from "../utils/dom";
import { bangs } from "../bang";
import { filterAndSortBangs, getCombinedBangs } from "../utils/bangUtils";
import { BangItem } from "../types/BangItem";
import { loadSettings } from "../utils/settings";

export interface BangDropdownOptions {
  maxItems?: number;
  maxHeight?: string;
  onSelectBang?: (bangText: string) => void;
  appendTo?: HTMLElement; // Element to append the dropdown to (default: input parent)
  positionStyle?: 'absolute' | 'fixed'; // Positioning style (default: absolute)
  zIndex?: number; // z-index for the dropdown (default: 999)
}

export class BangDropdown {
  private container: HTMLDivElement | null = null;
  private isVisible = false;
  private selectedIndex = -1;
  private inputElement: HTMLInputElement;
  private options: BangDropdownOptions;
  private filteredBangs: BangItem[] = [];
  private documentClickHandler: (e: MouseEvent) => void;
  private tabKeyHandler: (e: KeyboardEvent) => void;
  
  constructor(inputElement: HTMLInputElement, options: BangDropdownOptions = {}) {
    this.inputElement = inputElement;
    this.options = {
      maxItems: 25,
      maxHeight: '30vh',
      ...options
    };
    
    // Setup click handler on document to close dropdown when clicking outside
    this.documentClickHandler = (e: MouseEvent) => {
      if (!this.isVisible) return;
      
      const target = e.target as Node;
      if (
        this.container && 
        !this.container.contains(target) && 
        target !== this.inputElement
      ) {
        this.hide();
      }
    };
    
    // Add Tab key handler to select top option
    this.tabKeyHandler = (e: KeyboardEvent) => {
      if (e.key === "Tab" && this.isVisible && this.filteredBangs.length > 0) {
        e.preventDefault(); // Prevent default tab behavior
        
        // If an item is selected, use that one, otherwise select the first item
        if (this.selectedIndex >= 0) {
          this.selectCurrent();
        } else {
          this.selectTopOption();
        }
      }
    };
    
    // Attach event listeners
    document.addEventListener("click", this.documentClickHandler);
    this.inputElement.addEventListener("keydown", this.tabKeyHandler);
    
    // Add window resize handler for fixed positioning
    if (options.positionStyle === 'fixed' && options.appendTo) {
      window.addEventListener('resize', () => {
        if (this.isVisible && this.container) {
          const rect = this.inputElement.getBoundingClientRect();
          this.container.style.left = `${rect.left}px`;
          this.container.style.width = `${rect.width}px`;
          this.container.style.top = `${rect.bottom + 2}px`;
        }
      });
    }
  }
  
  // Add method to select the top option
  public selectTopOption(): void {
    if (this.filteredBangs.length > 0) {
      const bang = this.filteredBangs[0];
      this.selectBang(String(bang.t));
    }
  }
  
  /**
   * Shows the dropdown with filtered bang items
   * @param query Search query to filter bangs
   */
  public show(query: string): void {
    // Ensure we have a container
    this.ensureContainer();
    
    if (!this.container) return;
    
    // Make sure the container is visible
    this.container.style.display = 'block';
    this.isVisible = true;
    
    // If there's no query, show a helpful message
    if (!query) {
      this.container.innerHTML = `
        <div class="py-3 px-4 text-white/50 text-center italic text-sm">
          Start typing to search for bangs...
        </div>
      `;
      return;
    }
    
    // Filter and sort the bangs based on the query
    const settings = loadSettings();
    const combinedBangs = getCombinedBangs(settings);
    this.filteredBangs = filterAndSortBangs(combinedBangs, query, this.options.maxItems);
    
    // Populate the dropdown
    this.populateDropdown();
    
    // Position and style the dropdown
    if (this.container) {
      // If using fixed positioning, update position based on current input position
      if (this.options.positionStyle === 'fixed' && this.options.appendTo) {
        const rect = this.inputElement.getBoundingClientRect();
        this.container.style.left = `${rect.left}px`;
        this.container.style.width = `${rect.width}px`;
        this.container.style.top = `${rect.bottom + 2}px`; // Adding small offset
      }
      
      this.container.style.background = 'linear-gradient(to bottom, rgba(45, 0, 30, 0.9), rgba(0, 0, 0, 0.95))';
      
      // Disable interactions with footer elements while dropdown is visible
      this.disableFooterInteractions(true);
    }
  }
  
  /**
   * Directly sets the filtered bangs array
   * This allows external components (like workers) to pre-filter bangs
   * @param filteredBangs Pre-filtered array of bang items
   */
  public setFilteredBangs(filteredBangs: BangItem[]): void {
    this.filteredBangs = filteredBangs;
    
    if (this.isVisible && this.container) {
      this.populateDropdown();
    }
  }
  
  /**
   * Populates the dropdown with the current filtered bangs
   */
  private populateDropdown(): void {
    if (!this.container) return;
    
    // Clear the container
    this.container.innerHTML = '';
    
    // Reset selected index
    this.selectedIndex = -1;
    
    // If no results, show a message
    if (this.filteredBangs.length === 0) {
      this.container.innerHTML = `
        <div class="py-3 px-4 text-white/50 text-center italic text-sm">
          No matching bangs found
        </div>
      `;
      return;
    }
    
    // Create a container for the bang items
    const resultsContainer = createElement('div', {
      className: 'overflow-y-auto',
      style: {
        maxHeight: this.options.maxHeight
      }
    });
    
    // Add each bang item to the results container
    this.filteredBangs.forEach((bang, index) => {
      const bangItem = this.createBangItem(bang);
      
      // Add click handler
      bangItem.addEventListener('click', () => {
        this.selectedIndex = index;
        this.selectCurrent();
      });
      
      // Add hover handler
      bangItem.addEventListener('mouseenter', () => {
        // Store previous selected index
        const prevIndex = this.selectedIndex;
        
        // Update selected index
        this.selectedIndex = index;
        
        // Remove highlight from previous item if it's different
        if (prevIndex >= 0 && prevIndex !== index && prevIndex < this.filteredBangs.length) {
          const items = this.container?.querySelector('.overflow-y-auto')?.querySelectorAll('.cursor-pointer');
          if (items && prevIndex < items.length) {
            //items[prevIndex].classList.remove('bg-[#3a0082]/80');
            items[prevIndex].classList.remove('border-l-4');
            items[prevIndex].classList.remove('border-[#3a86ff]');
            items[prevIndex].classList.remove('pl-1');
          }
        }
        
        // Highlight current item
        //bangItem.classList.add('bg-[#3a0082]/80');
      });
      
      // Add mouseleave handler to handle hover state properly
      bangItem.addEventListener('mouseleave', () => {
        // Only remove highlight if we're not navigating with keyboard
        // We'll know we're using keyboard if the selectedIndex changes after this
        const currentIndex = this.selectedIndex;
        
        // Use setTimeout to allow any keyboard navigation to happen first
        setTimeout(() => {
          if (this.selectedIndex === currentIndex) {
            // If selectedIndex is still the same, we're not navigating with keyboard
            // So we can remove the highlight and reset selectedIndex
            //bangItem.classList.remove('bg-[#3a0082]/80');
            this.selectedIndex = -1;
          }
        }, 50);
      });
      
      resultsContainer.appendChild(bangItem);
    });
    
    // Add the results container to the dropdown
    this.container.appendChild(resultsContainer);
  }
  
  public hide(): void {
    if (this.container) {
      // Clear all highlights before hiding
      /*const highlightedItems = this.container.querySelectorAll('.bg-[#3a0082]/80');
      highlightedItems.forEach(item => {
        item.classList.remove('bg-[#3a0082]/80');
      });*/
      
      // Clear all border styles
      const borderedItems = this.container.querySelectorAll('.border-l-4');
      borderedItems.forEach(item => {
        item.classList.remove('border-l-4');
        item.classList.remove('border-[#3a86ff]');
        item.classList.remove('pl-1');
      });
      
      this.container.style.display = 'none';
      this.isVisible = false;
      this.selectedIndex = -1;
      
      // Re-enable interactions with footer
      this.disableFooterInteractions(false);
    }
  }
  
  public navigateUp(): void {
    this.navigate(-1);
  }
  
  public navigateDown(): void {
    this.navigate(1);
  }
  
  public selectCurrent(): void {
    if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredBangs.length) {
      const bang = this.filteredBangs[this.selectedIndex];
      this.selectBang(String(bang.t));
    }
  }
  
  public isDropdownVisible(): boolean {
    return this.isVisible;
  }
  
  private navigate(direction: number): void {
    if (!this.container) return;
    
    // Updated selector to match the actual bang items created in createBangItem method
    const resultsContainer = this.container.querySelector('.overflow-y-auto');
    if (!resultsContainer) return;
    
    const items = resultsContainer.querySelectorAll('.cursor-pointer');
    if (items.length === 0) return;
    
    // Calculate new index
    const newIndex = Math.max(0, Math.min(items.length - 1, this.selectedIndex + direction));
    
    // Clear all highlights and custom styles first
    items.forEach(item => {
      //item.classList.remove('bg-[#3a0082]/80');
      item.classList.remove('border-l-4');
      item.classList.remove('border-[#3a86ff]');
      item.classList.remove('pl-1'); // Remove extra padding
    });
    
    // Highlight new item with a more prominent color and border to override hover effect
    const selectedItem = items[newIndex] as HTMLElement;
    //selectedItem.classList.add('bg-[#3a0082]/80');
    selectedItem.classList.add('border-l-4');
    selectedItem.classList.add('border-[#3a86ff]');
    selectedItem.classList.add('pl-1');
    
    this.selectedIndex = newIndex;
    
    // Scroll item into view if needed
    selectedItem.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth'
    });
  }
  
  private createBangItem(bang: BangItem): HTMLDivElement {
    const item = createElement('div', {
      className: 'p-2 cursor-pointer hover:bg-black/30 transition-colors rounded'
    });
    
    // Store the original bang object
    const originalBang = bang;
    
    // Get the original trigger array if available in the bang's __originalBang property
    // This is needed to display aliases
    let originalTriggers: string[] = [];
    
    // For backward compatibility, try to get the original triggers if available
    if (Array.isArray(originalBang.__originalT)) {
      originalTriggers = originalBang.__originalT;
    } else if (Array.isArray(originalBang.t)) {
      originalTriggers = originalBang.t;
    }
    
    // First line: Shortcut and Service name
    const titleRow = createElement('div', {
      className: 'flex items-center justify-between'
    });
    
    // In our filtered results, t should now be a string
    const triggerText = String(bang.t);
    
    const shortcut = createElement('span', {
      className: 'font-mono text-[#3a86ff] font-bold'
    }, [`!${triggerText}`]);
    
    const service = createElement('span', {
      className: 'text-white font-medium'
    }, [bang.s]);
    
    titleRow.append(shortcut, service);
    
    // Second line: Website and Category
    const detailRow = createElement('div', {
      className: 'flex items-center justify-between mt-1 text-sm'
    });
    
    const website = createElement('span', {
      className: 'text-white/60'
    }, [bang.d]);
    
    const category = createElement('span', {
      className: 'text-white/40 text-xs px-2 py-0.5 bg-[#3a86ff]/10 rounded-full'
    }, [`${bang.c}${bang.sc !== bang.c ? ` · ${bang.sc}` : ''}`]);
    
    detailRow.append(website, category);
    
    // Always append the first two rows
    item.append(titleRow, detailRow);
    
    // If there are multiple triggers in the original bang, show them as aliases
    if (originalTriggers.length > 1) {
      // Filter out the current trigger to avoid duplication
      const otherTriggers = originalTriggers.filter(t => t !== triggerText);
      
      if (otherTriggers.length > 0) {
        const aliasesRow = createElement('div', {
          className: 'text-xs text-white/40 mt-1'
        });
        
        const aliasesLabel = createElement('span', {
          className: 'mr-1'
        }, ['Aliases:']);
        
        const aliasesList = createElement('span', {
          className: 'font-mono'
        }, [otherTriggers.map(t => `!${t}`).join(', ')]);
        
        aliasesRow.append(aliasesLabel, aliasesList);
        item.append(aliasesRow);
      }
    }
    
    return item;
  }
  
  private ensureContainer(): void {
    if (!this.container) {
      const positionStyle = this.options.positionStyle || 'absolute';
      const zIndex = this.options.zIndex || 999;
      
      // Create the container with proper z-index
      this.container = createElement('div', {
        className: `${positionStyle} left-0 right-0 top-full mt-2 bg-black/90 border border-white/10 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent`,
        style: `max-height: ${this.options.maxHeight}; z-index: ${zIndex};`
      });
      
      // Determine where to append the container
      if (this.options.appendTo) {
        // If appendTo is specified, use it
        this.options.appendTo.appendChild(this.container);
        
        // Adjust position based on input element's position
        if (this.options.positionStyle === 'fixed') {
          const rect = this.inputElement.getBoundingClientRect();
          this.container.style.left = `${rect.left}px`;
          this.container.style.right = `${window.innerWidth - rect.right}px`;
          this.container.style.top = `${rect.bottom}px`;
          this.container.style.width = `${rect.width}px`;
        }
      } else {
        // Default behavior - append to parent
        const inputWrapper = this.inputElement.closest('.relative');
        if (inputWrapper) {
          inputWrapper.appendChild(this.container);
        } else {
          // Fallback to adding after input if wrapper not found
          const parent = this.inputElement.parentElement;
          if (parent) {
            parent.appendChild(this.container);
          }
        }
      }
    }
  }
  
  private selectBang(bangText: string): void {
    if (this.options.onSelectBang) {
      this.options.onSelectBang(bangText);
    }
    this.hide();
  }
  
  private disableFooterInteractions(disable: boolean): void {
    // Find the footer element
    const footer = document.querySelector('footer');
    
    if (footer) {
      // Apply styles to disable/enable interactions with footer
      footer.style.pointerEvents = disable ? 'none' : 'auto';
      
      // Apply blur effect to footer when dropdown is visible
      if (disable) {
        footer.classList.add('footer-blurred');
        
        // Add the CSS rule for the blur effect if it doesn't exist yet
        if (!document.getElementById('footer-blur-style')) {
          const style = document.createElement('style');
          style.id = 'footer-blur-style';
          style.textContent = `
            .footer-blurred {
              filter: blur(8px);
              opacity: 0.6;
              transition: filter 0.2s ease, opacity 0.2s ease;
            }
          `;
          document.head.appendChild(style);
        }
      } else {
        footer.classList.remove('footer-blurred');
      }
    }
  }
  
  /**
   * Properly disposes the dropdown and removes all event listeners
   */
  public dispose(): void {
    // Remove global event listeners
    document.removeEventListener("click", this.documentClickHandler);
    
    // Remove input element event listeners
    if (this.inputElement) {
      this.inputElement.removeEventListener("keydown", this.tabKeyHandler);
    }
    
    // Hide and remove the dropdown from DOM
    this.hide();
    
    // Clear references
    this.container = null;
    this.filteredBangs = [];
  }
  
  public getSelectedIndex(): number {
    return this.selectedIndex;
  }
} 
