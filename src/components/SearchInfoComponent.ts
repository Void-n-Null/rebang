import { createElement } from "../utils/dom";

export interface BangExample {
  name: string;
  desc: string;
}

export class SearchInfoComponent {
  private container: HTMLDivElement;
  private examples: BangExample[];
  
  constructor(examples: BangExample[] = []) {
    // Use default examples if none provided
    this.examples = examples.length > 0 ? examples : [
      { name: '!g', desc: 'Google' },
      { name: '!yt', desc: 'YouTube' },
      { name: '!w', desc: 'Wikipedia' },
      { name: '!gh', desc: 'GitHub' }
    ];
    
    // Create search info badges container
    this.container = createElement('div', {
      className: 'flex flex-wrap gap-2 mt-3 justify-center'
    });
    
    // Create badges for each example
    this.examples.forEach(ex => {
      const badge = createElement('span', {
        className: 'inline-flex items-center px-2 py-1 rounded-full bg-white/10 text-white/70 text-xs backdrop-blur-sm transition-all hover:bg-white/20 cursor-pointer'
      }, [`${ex.name} (${ex.desc})`]);
      
      // Add click event to start a search with this bang
      badge.addEventListener('click', () => {
        window.location.href = `/?q=${encodeURIComponent(ex.name)}`;
      });
      
      this.container.appendChild(badge);
    });
  }
  
  public getElement(): HTMLDivElement {
    return this.container;
  }
  
  public updateExamples(examples: BangExample[]): void {
    this.examples = examples;
    
    // Clear container
    this.container.innerHTML = '';
    
    // Create badges for each example
    this.examples.forEach(ex => {
      const badge = createElement('span', {
        className: 'inline-flex items-center px-2 py-1 rounded-full bg-white/10 text-white/70 text-xs backdrop-blur-sm transition-all hover:bg-white/20 cursor-pointer'
      }, [`${ex.name} (${ex.desc})`]);
      
      // Add click event to start a search with this bang
      badge.addEventListener('click', () => {
        window.location.href = `/?q=${encodeURIComponent(ex.name)}`;
      });
      
      this.container.appendChild(badge);
    });
  }
} 