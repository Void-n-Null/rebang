import { createElement } from "../utils/dom";
import { UserSettings } from "../utils/settings";
import { CustomBangModal } from "./CustomBangModal";
import { DefaultBangDisplayManager } from "./DefaultBangDisplayManager";
import { BangInputHandler } from "./BangInputHandler";

/**
 * Component for managing bang settings
 * Extracted from SettingsModal to reduce file size and improve maintainability
 */
export class BangSettingsSection {
  private settings: UserSettings;
  private onSettingsChange: (settings: UserSettings) => void;
  private showErrorNotification: (message: string) => void;
  
  private customBangManagerModal: CustomBangModal;
  private displayManager: DefaultBangDisplayManager;
  private inputHandler: BangInputHandler;
  
  constructor(
    settings: UserSettings, 
    onSettingsChange: (settings: UserSettings) => void,
    showErrorNotification: (message: string) => void
  ) {
    this.settings = settings;
    this.onSettingsChange = onSettingsChange;
    this.showErrorNotification = showErrorNotification;
    
    // Initialize sub-components
    this.displayManager = new DefaultBangDisplayManager(settings, this.handleSettingsChange);
    this.inputHandler = new BangInputHandler(
      settings, 
      this.handleSettingsChange, 
      showErrorNotification,
      this.displayManager
    );
    this.customBangManagerModal = new CustomBangModal(this.handleCustomBangsChange);
  }
  
  /**
   * Handle settings changes
   */
  private handleSettingsChange = (updatedSettings: UserSettings): void => {
    this.settings = updatedSettings;
    this.onSettingsChange(this.settings);
  };
  
  /**
   * Handle changes to custom bangs
   */
  private handleCustomBangsChange = (updatedSettings: UserSettings): void => {
    this.settings = updatedSettings;
    this.onSettingsChange(this.settings);
    
    // If the bang dropdown is open, refresh it with the new combined bangs
    const inputElement = this.inputHandler.getInputElement();
    if (inputElement) {
      const query = inputElement.value.toLowerCase().replace(/^!/, '') || '';
      // The inputHandler will handle refreshing the dropdown
      inputElement.dispatchEvent(new Event('input'));
    }
  };
  
  /**
   * Creates the UI for setting a default bang
   */
  public render(createFormGroup: (title: string, description: string) => HTMLDivElement): HTMLDivElement {
    const section = createElement('div', {
      className: 'mb-4'
    });
    
    // Use the standardized form group from MainModal
    const formGroup = createFormGroup(
      'Default Bang', 
      'Automatically use this bang when searching without a prefix.'
    );
    
    // Create custom bangs button area
    const headerActions = createElement('div', {
        className: 'absolute top-0 right-0'
    });
    
    const customBangsButton = createElement('button', {
      className: 'text-xs font-medium bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-colors border border-white/5 hover:border-white/10 flex items-center gap-2',
      type: 'button'
    }, [
        createElement('span', {}, ['Manage Custom Bangs']),
        createElement('span', { className: 'opacity-50' }, ['→'])
    ]);
    
    customBangsButton.addEventListener('click', () => {
      this.customBangManagerModal.show();
    });
    
    // We need to inject the button into the label row, which is tricky with createFormGroup.
    // Instead, we'll just append it after the description for now, or wrap it nicely.
    // Actually, let's put it *between* description and input.
    
    const controlsContainer = createElement('div', {
        className: 'mt-3 space-y-3'
    });

    controlsContainer.appendChild(customBangsButton);

    // Create current bang service display
    const currentBangContainer = this.displayManager.createBangServiceDisplay();
    
    // Create bang input
    const inputContainer = this.inputHandler.createBangInput();
    
    // Assemble the section
    formGroup.append(
        currentBangContainer,
        inputContainer,
        controlsContainer
    );
    
    section.appendChild(formGroup);
    
    return section;
  }
  
  /**
   * Dispose of resources when the component is no longer needed
   */
  public dispose(): void {
    this.inputHandler.dispose();
  }
} 