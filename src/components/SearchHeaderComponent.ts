import { createElement } from "../utils/dom";
import { AboutPage } from "./AboutPage";

export interface SearchHeaderOptions {
  onCustomBangsClick?: () => void;
  onSettingsClick?: () => void;
}

export class SearchHeaderComponent {
  private container: HTMLDivElement;
  private buttonsContainer: HTMLDivElement;
  private heading: HTMLHeadingElement;
  private customBangsButton: HTMLButtonElement;
  private settingsIcon: HTMLButtonElement;
  private aboutButton: HTMLButtonElement;
  private aboutPage: AboutPage;
  
  constructor(options: SearchHeaderOptions = {}) {
    // Create the about page
    this.aboutPage = new AboutPage();
    
    // Create container for the header
    this.container = createElement('div', {
      className: 'mb-6 flex flex-col items-center'
    });
    
    // Create the heading text
    this.heading = createElement('h2', {
      className: 'text-white text-lg sm:text-xl md:text-2xl font-light text-center tracking-wider',
    }, ['Start Searching with a !Bang']);
    
    // Create buttons container for action buttons that spans full width
    this.buttonsContainer = createElement('div', {
      className: 'flex items-center justify-between w-full mt-2 px-4'
    });
    
    // Add custom bangs button on the left
    this.customBangsButton = createElement('button', {
      className: 'text-white/50 hover:text-white/90 transition-colors px-3 py-1 rounded-full hover:bg-white/10 flex items-center'
    }, [
      'My Bangs',
      createElement('span', { className: 'ml-1' }, ['+'])
    ]);
    
    // Add click event for custom bangs button
    if (options.onCustomBangsClick) {
      this.customBangsButton.addEventListener('click', options.onCustomBangsClick);
    }
    
    // Create right side buttons container for about and settings
    const rightButtonsContainer = createElement('div', {
      className: 'flex items-center gap-2'
    });
    
    // Add about button (question mark)
    this.aboutButton = createElement('button', {
      className: 'text-white/50 hover:text-white/90 transition-colors w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10',
      title: 'About !ReBang'
    });
    
    // Create question mark icon
    const questionMarkIcon = createElement('span', {
      className: 'text-xl font-semibold'
    }, ['?']);
    
    this.aboutButton.appendChild(questionMarkIcon);
    
    // Add click event for about button
    this.aboutButton.addEventListener('click', () => {
      this.aboutPage.show();
    });
    
    // Add settings gear icon using SVG
    this.settingsIcon = createElement('button', {
      className: 'text-white/50 hover:text-white/90 transition-colors w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10'
    });
    
    // Create an img element for the SVG
    const gearIcon = createElement('img', {
      src: '/gear-black.svg',
      alt: 'Settings',
      className: 'w-6 h-6 opacity-80 filter invert hover:opacity-100 transition-opacity'
    });
    
    this.settingsIcon.appendChild(gearIcon);
    
    // Add click event for settings icon
    if (options.onSettingsClick) {
      this.settingsIcon.addEventListener('click', options.onSettingsClick);
    }
    
    // Add buttons to the right container
    rightButtonsContainer.append(this.aboutButton, this.settingsIcon);
    
    // Add left and right containers to the main buttons container
    this.buttonsContainer.append(this.customBangsButton, rightButtonsContainer);
    
    // Add heading and buttons to container
    this.container.append(this.heading, this.buttonsContainer);
  }
  
  public getElement(): HTMLDivElement {
    return this.container;
  }
  
  public setCustomBangsButtonEnabled(enabled: boolean): void {
    this.customBangsButton.disabled = !enabled;
    this.customBangsButton.style.opacity = enabled ? '1' : '0.5';
  }
  
  public setSettingsButtonEnabled(enabled: boolean): void {
    this.settingsIcon.disabled = !enabled;
    this.settingsIcon.style.opacity = enabled ? '1' : '0.5';
  }
} 