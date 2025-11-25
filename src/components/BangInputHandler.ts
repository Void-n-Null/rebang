import { createElement, debounce } from "../utils/dom";
import { updateSetting, UserSettings } from "../utils/settings";
import { BangDropdown } from "./BangDropdown";
import { setKeyboardNavigationActive } from '../utils/dropdownUtils';
import { getCombinedBangsFromSettings } from "../utils/bangSettingsUtil";
import { DefaultBangDisplayManager } from "./DefaultBangDisplayManager";

/**
 * Handles the bang input field and dropdown
 */
export class BangInputHandler {
  private settings: UserSettings;
  private onSettingsChange: (settings: UserSettings) => void;
  private showErrorNotification: (message: string) => void;
  private displayManager: DefaultBangDisplayManager;
  
  private inputElement: HTMLInputElement | null = null;
  private bangDropdown: BangDropdown | null = null;
  private isSelectingItem: boolean = false;
  
  constructor(
    settings: UserSettings,
    onSettingsChange: (settings: UserSettings) => void,
    showErrorNotification: (message: string) => void,
    displayManager: DefaultBangDisplayManager
  ) {
    this.settings = settings;
    this.onSettingsChange = onSettingsChange;
    this.showErrorNotification = showErrorNotification;
    this.displayManager = displayManager;
  }
  
  /**
   * Creates the input field for bang selection
   */
  public createBangInput(): HTMLDivElement {
    // Create search input for bang selection
    const inputContainer = createElement('div', {
      className: 'relative'
    });
    
    // Create the bang prefix element
    const bangPrefix = createElement('span', {
      className: 'absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 font-bold select-none pointer-events-none z-10'
    }, ['!']);
    
    // Create the input with padding for the prefix but without backdrop-blur on the input
    this.inputElement = createElement('input', {
      type: 'text',
      className: 'w-full pl-8 pr-10 py-2.5 bg-white/5 hover:bg-white/10 placeholder-white/30 rounded-lg border border-white/10 focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none transition-all text-white text-sm',
      placeholder: 'search trigger (e.g. "g" for Google)',
      autocomplete: 'off',
      spellcheck: 'false'
    }) as HTMLInputElement;
    
    // Add clear button
    const clearButton = createElement('button', {
      type: 'button',
      className: 'absolute right-3 top-1/2 transform -translate-y-1/2 text-white/30 hover:text-white transition-colors w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10'
    });
    clearButton.innerHTML = '&times;';
    
    // Set up input event handlers
    this.setupInputHandlers(this.inputElement, clearButton);
    
    // Set the initial value
    if (this.settings.defaultBang) {
      const bangText = this.settings.defaultBang;
      const cleanBangText = bangText.replace(/[^a-zA-Z0-9]/g, '');
      
      // Set the clean text without prefix
      this.inputElement.value = cleanBangText;
    }
    
    inputContainer.append(bangPrefix, this.inputElement, clearButton);
    
    return inputContainer;
  }
  
  /**
   * Sets up event handlers for the bang input field
   * @param inputElement The input element to set up handlers for
   * @param clearButton The clear button associated with the input
   */
  private setupInputHandlers(inputElement: HTMLInputElement, clearButton: HTMLButtonElement): void {
    // Handle input events for search
    inputElement.addEventListener('input', (e) => {
      const rawValue = (e.target as HTMLInputElement).value;
      const cleanValue = rawValue.replace(/[^a-zA-Z0-9]/g, '');
      
      // Update the input value if it's different (to handle removed characters)
      if (rawValue !== cleanValue) {
        inputElement.value = cleanValue;
      }
      
      // Use the clean value directly for searching
      const query = cleanValue;
      
      // Create dropdown if it doesn't exist
      if (!this.bangDropdown) {
        this.bangDropdown = new BangDropdown(inputElement, {
          onSelectBang: (bangText: string) => {
            // Set flag to indicate we're selecting an item
            this.isSelectingItem = true;
            this.handleBangSelection(bangText);
            // Reset flag after a short delay
            setTimeout(() => {
              this.isSelectingItem = false;
            }, 100);
          },
          appendTo: document.body, // Append to body to avoid modal clipping
          positionStyle: 'fixed',  // Use fixed positioning
          zIndex: 9999            // Ensure it's above other elements
        });
      }
      
      this.bangDropdown.show(query);
      
      // Live update "Currently using" section when typing
      this.displayManager.updateBangDisplayFromInput(query);
    });
    
    // Handle focus to show all bangs
    inputElement.addEventListener('focus', () => {
      const query = inputElement.value.toLowerCase().replace(/^!/, '') || '';
      
      // Create dropdown if it doesn't exist
      if (!this.bangDropdown) {
        this.bangDropdown = new BangDropdown(inputElement, {
          onSelectBang: (bangText: string) => {
            // Set flag to indicate we're selecting an item
            this.isSelectingItem = true;
            this.handleBangSelection(bangText);
            // Reset flag after a short delay
            setTimeout(() => {
              this.isSelectingItem = false;
            }, 100);
          },
          appendTo: document.body, // Append to body to avoid modal clipping
          positionStyle: 'fixed',  // Use fixed positioning
          zIndex: 9999            // Ensure it's above other elements
        });
      }
      
      this.bangDropdown.show(query);
      
      // Enable keyboard navigation
      setKeyboardNavigationActive(true);
    });
    
    // Create a debounced version of the cleanup function
    const debouncedCleanup = debounce((e: FocusEvent) => {
      // Don't process if we're in the middle of selecting an item
      if (this.isSelectingItem) {
        return;
      }
      
      this.cleanupDropdown();
      
      // Only process if this wasn't triggered by the clear button
      // Check if the related target is the clear button
      const clearButtonClicked = e.relatedTarget === clearButton;
      if (!clearButtonClicked) {
        // Process and save the bang setting based on input
        this.processAndSaveBangSetting();
      }
      
      // Disable keyboard navigation
      setKeyboardNavigationActive(false);
    }, 200);
    
    // Handle blur to hide dropdown
    inputElement.addEventListener('blur', (e) => {
      // Use the debounced cleanup function
      debouncedCleanup(e);
    });
    
    // Set up clear button
    clearButton.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent default button behavior
      
      if (inputElement) {
        // Clear input but don't replace with any text
        inputElement.value = '';
        
        // Reset to default Google in the display ONLY, not in the input
        this.displayManager.updateCurrentBangDisplay('Google (default)');
        
        // Clear default bang setting
        this.settings.defaultBang = undefined;
        this.onSettingsChange(this.settings);
        
        // Hide dropdown if visible
        if (this.bangDropdown) {
          this.bangDropdown.hide();
        }
      }
    });
  }
  
  /**
   * Process the input and save the best matching bang setting
   * If input is empty, ONLY update the display label but DON'T modify the input field
   */
  private processAndSaveBangSetting(): void {
    if (!this.inputElement) return;
    
    const inputValue = this.inputElement.value || '';
    const combinedBangs = getCombinedBangsFromSettings();
    
    // If the input is empty, do nothing - keep the current default bang setting
    if (!inputValue) {
      console.log("Empty input, keeping current default bang");
      // Optionally update display to reflect current state, but don't change settings
      if (this.settings.defaultBang) {
        const currentBang = combinedBangs.find(b => 
          (Array.isArray(b.t) ? b.t.includes(this.settings.defaultBang!) : b.t === this.settings.defaultBang!)
        );
        if (currentBang) {
          this.displayManager.updateCurrentBangDisplay(currentBang.s);
        }
      } else {
        this.displayManager.updateCurrentBangDisplay('No default bang set');
      }
      return;
    }
    
    // Parse the bang from input (format: bang - Service Name or just bang)
    const bangParts = inputValue.split('-').map(part => part.trim());
    const bangText = bangParts[0].replace(/^!/, ''); // Remove any ! prefix if present
    
    if (bangText) {
      // Find the matching bang
      const matchingBang = combinedBangs.find(b => 
        (Array.isArray(b.t) ? b.t.includes(bangText) : b.t === bangText)
      );
      
      if (matchingBang) {
        // Use the specific trigger that was entered
        this.settings.defaultBang = bangText;
        
        // Save the setting
        try {
          updateSetting('defaultBang', bangText);
          this.onSettingsChange(this.settings);
        } catch (error) {
          console.error('Failed to update default bang setting:', error);
          this.showErrorNotification('Failed to save your default bang setting.');
        }
      }
    }
  }
  
  /**
   * Handle bang selection from the dropdown
   */
  private handleBangSelection(bangText: string): void {
    if (!this.inputElement) return;
    
    // Find the selected bang
    const combinedBangs = getCombinedBangsFromSettings();
    
    // Clean the bangText to only allow alphanumeric characters
    const cleanBangText = bangText.replace(/[^a-zA-Z0-9]/g, '');
    
    // The bangText is the trigger
    const selectedBang = combinedBangs.find(b => 
      (Array.isArray(b.t) ? b.t.includes(cleanBangText) : b.t === cleanBangText)
    );
    
    if (selectedBang) {
      this.settings.defaultBang = cleanBangText;
      
      // Use clean text without prefix
      this.inputElement.value = cleanBangText;
      
      // Update the display label 
      this.displayManager.updateCurrentBangDisplay(selectedBang.s);
      
      // Save the setting
      try {
        updateSetting('defaultBang', cleanBangText);
        this.onSettingsChange(this.settings);
      } catch (error) {
        console.error('Failed to update default bang setting:', error);
        this.showErrorNotification('Failed to save your default bang setting.');
      }
    } else {
      this.inputElement.value = cleanBangText;
    }
    
    // Hide and dispose the dropdown
    this.cleanupDropdown();
  }
  
  /**
   * Clean up the dropdown when it's no longer needed
   */
  private cleanupDropdown(): void {
    if (this.bangDropdown) {
      this.bangDropdown.hide();
    }
  }
  
  /**
   * Dispose of resources when the component is no longer needed
   */
  public dispose(): void {
    if (this.bangDropdown) {
      this.bangDropdown.hide();
      this.bangDropdown.dispose();
      this.bangDropdown = null;
    }
  }
  
  /**
   * Gets the current input element
   */
  public getInputElement(): HTMLInputElement | null {
    return this.inputElement;
  }
} 