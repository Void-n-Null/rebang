import { createElement } from "../utils/dom";
import { UserSettings } from "../utils/settings";
import { getCombinedBangsFromSettings } from "../utils/bangSettingsUtil";

/**
 * Manages the display of the current bang service
 */
export class DefaultBangDisplayManager {
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
   * Creates the current bang service display element
   */
  public createBangServiceDisplay(): HTMLDivElement {
    // Create current bang service label
    const currentBangContainer = createElement('div', {
      className: 'bg-white/5 border border-white/5 rounded-lg p-3 mb-3 flex items-center justify-between'
    });
    
    const currentBangLabel = createElement('div', {
      className: 'flex items-center gap-2 text-sm'
    });
    
    const currentBangPrefix = createElement('span', {
      className: 'text-white/50'
    });
    currentBangPrefix.textContent = 'Currently using:';
    
    const currentBangService = createElement('span', {
      className: 'text-[#a788ff] font-semibold tracking-wide',
      id: 'current-bang-service'
    });
    
    // Get the current default bang if set
    if (this.settings.defaultBang) {
      const bangText = this.settings.defaultBang;
      const combinedBangs = getCombinedBangsFromSettings();
      
      const matchingBang = combinedBangs.find(b => 
        (Array.isArray(b.t) ? b.t.includes(bangText) : b.t === bangText)
      );
      
      if (matchingBang) {
        currentBangService.textContent = `${matchingBang.s}`;
      } else {
        currentBangService.textContent = `${bangText} - Unknown Service`;
      }
    } else {
      currentBangService.textContent = 'Google (default)';
    }
    
    currentBangLabel.append(currentBangPrefix, currentBangService);
    currentBangContainer.appendChild(currentBangLabel);
    
    return currentBangContainer;
  }
  
  /**
   * Updates the current bang display element with the given text
   * @param displayText The text to display
   */
  public updateCurrentBangDisplay(displayText: string): void {
    const bangService = document.getElementById('current-bang-service');
    if (bangService) {
      bangService.textContent = displayText;
    }
  }
  
  /**
   * Updates the bang display based on the input query
   * @param query The current input query
   */
  public updateBangDisplayFromInput(query: string): void {
    // Try to match the current input and update in real-time
    const bangPart = query.split(/[ \-:;,]/)[0].trim();
    if (bangPart) {
      const combinedBangs = getCombinedBangsFromSettings();
      const directMatch = combinedBangs.find(b => 
        typeof b.t === 'string' 
          ? b.t.toLowerCase() === bangPart 
          : b.t.some(t => t.toLowerCase() === bangPart)
      );
      
      if (directMatch) {
        // Update the currently using label with the matched service
        this.updateCurrentBangDisplay(directMatch.s);
        
        // Auto-save on direct match
        this.settings.defaultBang = bangPart;
        this.onSettingsChange(this.settings);
      }
    } else if (query === '') {
      // Empty input - reset label to Google default
      this.updateCurrentBangDisplay('Google (default)');
      
      // Clear default bang setting
      this.settings.defaultBang = undefined;
      this.onSettingsChange(this.settings);
    }
  }
} 