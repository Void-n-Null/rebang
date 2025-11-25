import { createElement } from "../utils/dom";
import { UserSettings } from "../utils/settings";

/**
 * Component for managing redirect loading screen settings
 */
export class RedirectSettingsSection {
  private settings: UserSettings;
  private onSettingsChange: (settings: UserSettings) => void;
  
  constructor(
    settings: UserSettings, 
    onSettingsChange: (settings: UserSettings) => void
  ) {
    this.settings = settings;
    this.onSettingsChange = onSettingsChange;
  }
  
  /**
   * Handle toggle of redirect loading screen setting
   */
  private handleToggleRedirectScreen = (event: Event): void => {
    const checkbox = event.target as HTMLInputElement;
    const updatedSettings: UserSettings = {
      ...this.settings,
      showRedirectLoadingScreen: checkbox.checked
    };
    
    this.settings = updatedSettings;
    this.onSettingsChange(this.settings);
  };
  
  /**
   * Creates the UI for setting the redirect loading screen option
   */
  public render(createFormGroup: (title: string, description: string) => HTMLDivElement): HTMLDivElement {
    const section = createElement('div', {
      className: 'mb-4'
    });
    
    // Use the standardized form group from MainModal
    const formGroup = createFormGroup(
      'Redirect Loading Screen', 
      'When enabled, a loading screen will be shown briefly when redirecting to search results.'
    );
    
    // Create toggle switch container
    const toggleContainer = createElement('div', {
      className: 'flex items-center mt-2'
    });
    
    // Create the checkbox input (styled as a switch)
    const label = createElement('label', {
        className: 'relative inline-flex items-center cursor-pointer'
    });

    const checkbox = createElement('input', {
      type: 'checkbox',
      id: 'redirect-loading-toggle',
      className: 'sr-only peer'
    }) as HTMLInputElement;
    
    // Set initial state from settings
    checkbox.checked = this.settings.showRedirectLoadingScreen;
    
    // Add event listener
    checkbox.addEventListener('change', this.handleToggleRedirectScreen);

    const switchBg = createElement('div', {
        className: "w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7c3aed]"
    });

    const textLabel = createElement('span', {
      className: 'ml-3 text-sm font-medium text-white/80'
    }, ['Show loading screen during redirects']);
    
    label.append(checkbox, switchBg, textLabel);
    
    // Assemble the toggle container
    toggleContainer.appendChild(label);
    
    // Add toggle to form group
    formGroup.appendChild(toggleContainer);
    
    // Add form group to section
    section.appendChild(formGroup);
    
    return section;
  }
  
  /**
   * Dispose of resources when the component is no longer needed
   */
  public dispose(): void {
    // Clean up any event listeners or resources if needed
  }
} 