import { createElement } from "../utils/dom";
import { BangItem } from "../types/BangItem";
import { MainModal } from "./MainModal";

/**
 * Modal for adding or editing a bang
 */
export class BangFormModal extends MainModal {
  private onSave: (bang: BangItem | null, isEdit: boolean) => void;
  private isEditMode = false;
  private originalBang: BangItem | null = null;
  private errorMessage: HTMLDivElement | null = null;
  
  // Form inputs
  private triggerInput: HTMLInputElement | null = null;
  private serviceInput: HTMLInputElement | null = null;
  private domainInput: HTMLInputElement | null = null;
  private categoryInput: HTMLInputElement | null = null;
  private subcategoryInput: HTMLInputElement | null = null;
  private urlPatternInput: HTMLInputElement | null = null;
  
  constructor(onSave: (bang: BangItem | null, isEdit: boolean) => void) {
    super({
      title: 'Add Custom Bang',
      maxWidth: '2xl',
      showCloseButton: true,
      zIndex: 70
    });
    
    this.onSave = onSave;
  }
  
  /**
   * Shows the modal, optionally in edit mode with a bang to edit
   */
  public show(bang?: BangItem): void {
    this.isEditMode = !!bang;
    this.originalBang = bang || null;
    
    // Update title based on mode
    if (this.headerElement) {
      const titleElement = this.headerElement.querySelector('h2');
      if (titleElement) {
        titleElement.textContent = this.isEditMode ? 'Edit Custom Bang' : 'Add Custom Bang';
      }
    }
    
    // Call parent show method
    super.show();
    
    // Populate form fields if in edit mode
    if (bang && this.contentElement) {
      this.populateFormFields(bang);
    }
  }
  
  /**
   * Hides the modal and resets form
   */
  public hide(): void {
    super.hide();
    this.hideError();
    
    // Reset form after animation completes
    setTimeout(() => {
      if (this.contentElement) {
        // Find and reset the form
        const form = this.contentElement.querySelector('form');
        if (form) {
          form.reset();
        }
      }
    }, 300);
  }
  
  /**
   * Creates the modal content
   */
  protected createModal(): void {
    // Call parent method to create the basic modal structure
    super.createModal();
    
    // Error message container - ensure it doesn't get squished
    this.errorMessage = createElement('div', {
      className: 'bg-red-500/20 border border-red-500/40 text-white px-4 py-3 mb-4 rounded flex-shrink-0',
      style: 'display: none;'
    });
    
    // Scrollable content container for the form
    const formContent = createElement('div', {
      className: 'px-8 py-6 overflow-y-auto flex-grow' // This div will scroll
    });
    formContent.append(this.createBangForm()); // Put the form inside
    
    // Wrapper for error message and scrollable form content
    const contentWrapper = createElement('div', {
        className: 'flex flex-col overflow-hidden h-full min-h-0'
    });
    contentWrapper.append(this.errorMessage, formContent); // Error message first, then scrollable form
    
    // Set the wrapper as the main content for the modal
    this.setContent(contentWrapper);
    
    // Set footer buttons
    this.setFooterButtons([
      {
        text: 'Cancel',
        type: 'secondary',
        onClick: () => this.hide()
      },
      {
        text: this.isEditMode ? 'Save Changes' : 'Add Bang',
        type: 'primary',
        onClick: () => this.saveBang()
      }
    ]);
  }
  
  /**
   * Creates the form for entering bang details
   */
  private createBangForm(): HTMLFormElement {
    const form = createElement('form', {
      className: 'space-y-5'
    }) as HTMLFormElement;
    
    // Prevent form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveBang();
    });
    
    // Create a three-column layout for the main fields with equal heights
    const mainFieldsContainer = createElement('div', {
      className: 'grid grid-cols-1 md:grid-cols-3 gap-5 mb-5'
    });
    
    // Bang trigger (shortcut)
    const triggerGroup = this.createFormGroup(
      'Trigger',
      'What you type after the bang prefix',
      true
    );
    
    this.triggerInput = createElement('input', {
      type: 'text',
      className: 'w-full px-3 py-2 bg-black/20 backdrop-blur-sm hover:bg-black/30 placeholder-white/50 rounded border border-white/10 focus:border-[#3a86ff]/50 focus:bg-black/40 focus:outline-none transition-all text-white',
      placeholder: 'e.g., g, google',
      autocomplete: 'off',
      spellcheck: 'false',
      maxlength: '20',
      required: 'true'
    }) as HTMLInputElement;
    
    if (this.isEditMode) {
      // Make trigger read-only in edit mode to prevent changing the ID
      this.triggerInput.readOnly = true;
      this.triggerInput.className += ' opacity-70 cursor-not-allowed';
    }
    
    // Add validation for trigger - alphanumeric only
    this.triggerInput.addEventListener('input', () => {
      if (this.triggerInput) {
        // Remove any characters that aren't a-z, A-Z, 0-9, or underscore
        this.triggerInput.value = this.triggerInput.value.replace(/[^a-zA-Z0-9_]/g, '');
      }
    });
    
    // Add input to the last child of the group (inputContainer)
    triggerGroup.lastChild?.appendChild(this.triggerInput);
    
    // Service name
    const serviceGroup = this.createFormGroup(
      'Service Name',
      'Name of the service',
      true
    );
    
    this.serviceInput = createElement('input', {
      type: 'text',
      className: 'w-full px-3 py-2 bg-black/20 backdrop-blur-sm hover:bg-black/30 placeholder-white/50 rounded border border-white/10 focus:border-[#3a86ff]/50 focus:bg-black/40 focus:outline-none transition-all text-white',
      placeholder: 'e.g., Google Maps',
      autocomplete: 'off',
      required: 'true'
    }) as HTMLInputElement;
    
    // Add input to the last child of the group (inputContainer)
    serviceGroup.lastChild?.appendChild(this.serviceInput);
    
    // Domain
    const domainGroup = this.createFormGroup(
      'Domain',
      'Domain of the service',
      true
    );
    
    this.domainInput = createElement('input', {
      type: 'text',
      className: 'w-full px-3 py-2 bg-black/20 backdrop-blur-sm hover:bg-black/30 placeholder-white/50 rounded border border-white/10 focus:border-[#3a86ff]/50 focus:bg-black/40 focus:outline-none transition-all text-white',
      placeholder: 'e.g., maps.google.com',
      autocomplete: 'off',
      required: 'true'
    }) as HTMLInputElement;
    
    // Add input to the last child of the group (inputContainer)
    domainGroup.lastChild?.appendChild(this.domainInput);
    
    // Add to the main fields container
    mainFieldsContainer.append(triggerGroup, serviceGroup, domainGroup);
    form.appendChild(mainFieldsContainer);
    
    // Create a two-column layout for category and subcategory
    const categoryContainer = createElement('div', {
      className: 'grid grid-cols-1 md:grid-cols-2 gap-5 mb-5'
    });
    
    // Category (optional)
    const categoryGroup = this.createFormGroup(
      'Category',
      'Optional category for organization',
      false
    );
    
    this.categoryInput = createElement('input', {
      type: 'text',
      className: 'w-full px-3 py-2 bg-black/20 backdrop-blur-sm hover:bg-black/30 placeholder-white/50 rounded border border-white/10 focus:border-[#3a86ff]/50 focus:bg-black/40 focus:outline-none transition-all text-white',
      placeholder: 'e.g., maps',
      autocomplete: 'off'
    }) as HTMLInputElement;
    
    // Add input to the last child of the group (inputContainer)
    categoryGroup.lastChild?.appendChild(this.categoryInput);
    
    // Subcategory (optional)
    const subcategoryGroup = this.createFormGroup(
      'Subcategory',
      'Optional subcategory for further classification',
      false
    );
    
    this.subcategoryInput = createElement('input', {
      type: 'text',
      className: 'w-full px-3 py-2 bg-black/20 backdrop-blur-sm hover:bg-black/30 placeholder-white/50 rounded border border-white/10 focus:border-[#3a86ff]/50 focus:bg-black/40 focus:outline-none transition-all text-white',
      placeholder: 'e.g., directions',
      autocomplete: 'off'
    }) as HTMLInputElement;
    
    // Add input to the last child of the group (inputContainer)
    subcategoryGroup.lastChild?.appendChild(this.subcategoryInput);
    
    // Add to the category container
    categoryContainer.append(categoryGroup, subcategoryGroup);
    form.appendChild(categoryContainer);
    
    // URL Pattern (with search term placeholder)
    const urlPatternGroup = this.createFormGroup(
      'URL Pattern',
      'URL with {searchTerms} as placeholder for the search query',
      true
    );
    
    this.urlPatternInput = createElement('input', {
      type: 'text',
      className: 'w-full px-3 py-2 bg-black/20 backdrop-blur-sm hover:bg-black/30 placeholder-white/50 rounded border border-white/10 focus:border-[#3a86ff]/50 focus:bg-black/40 focus:outline-none transition-all text-white font-mono text-sm',
      placeholder: 'https://maps.google.com/maps?q={searchTerms}',
      autocomplete: 'off',
      required: 'true'
    }) as HTMLInputElement;
    
    // Add input to the last child of the group (inputContainer)
    urlPatternGroup.lastChild?.appendChild(this.urlPatternInput);
    form.appendChild(urlPatternGroup);
    
    // Help text about the URL pattern
    const helpText = createElement('div', {
      className: 'text-white/50 text-xs mt-2'
    }, ['Use {searchTerms} as a placeholder for the search query. Example: https://example.com/search?q={searchTerms}']);
    
    form.appendChild(helpText);
    
    return form;
  }
  
  /**
   * Creates a form group with label and description
   */
  protected createFormGroup(
    label: string,
    description: string,
    isRequired: boolean
  ): HTMLDivElement {
    const group = createElement('div', {
      className: 'flex flex-col h-full'
    });
    
    const labelContainer = createElement('div', {
      className: 'flex-shrink-0 min-h-[60px]'
    });
    
    const labelElement = createElement('label', {
      className: 'block text-white text-sm font-medium mb-1'
    });
    
    // Label text with optional required indicator
    const labelText = createElement('span', {}, [label]);
    labelElement.appendChild(labelText);
    
    if (isRequired) {
      const requiredIndicator = createElement('span', {
        className: 'text-red-500 ml-1'
      }, ['*']);
      labelElement.appendChild(requiredIndicator);
    }
    
    // Description
    const descriptionElement = createElement('p', {
      className: 'text-white/50 text-xs'
    }, [description]);
    
    labelContainer.append(labelElement, descriptionElement);
    
    // Input container
    const inputContainer = createElement('div', {
      className: 'flex-grow'
    });
    
    group.append(labelContainer, inputContainer);
    
    return group;
  }
  
  /**
   * Populates the form fields with bang data
   */
  private populateFormFields(bang: BangItem): void {
    if (this.triggerInput) {
      // Handle array of triggers by joining them with commas
      const triggerValue = Array.isArray(bang.t) ? bang.t.join(', ') : bang.t;
      this.triggerInput.value = triggerValue;
    }
    if (this.serviceInput) this.serviceInput.value = bang.s;
    if (this.domainInput) this.domainInput.value = bang.d;
    if (this.categoryInput) this.categoryInput.value = bang.c || '';
    if (this.subcategoryInput) this.subcategoryInput.value = bang.sc || '';
    if (this.urlPatternInput) this.urlPatternInput.value = bang.u;
  }
  
  /**
   * Saves the bang data and closes the modal
   */
  private saveBang(): void {
    // Validate form
    if (!this.validateForm()) {
      return;
    }
    
    // Get trigger value and split it into an array if it contains commas
    const triggerValue = this.triggerInput?.value.trim() || '';
    // Split by commas and trim each value
    const triggers = triggerValue.split(',').map(t => t.trim()).filter(t => t !== '');
    
    // Create bang object from form data
    const bang: BangItem = {
      t: triggers.length > 1 ? triggers : triggers[0] || '', // Use array if multiple triggers, otherwise use string
      s: this.serviceInput?.value.trim() || '',
      d: this.domainInput?.value.trim() || '',
      c: this.categoryInput?.value.trim() || undefined,
      sc: this.subcategoryInput?.value.trim() || undefined,
      r: this.originalBang?.r || 9999, // High relevance score for custom bangs
      u: this.urlPatternInput?.value.trim() || ''
    };
    
    // If category is empty, set it to undefined
    if (bang.c === '') bang.c = undefined;
    
    // If subcategory is empty, set it to undefined
    if (bang.sc === '') bang.sc = undefined;
    
    // If subcategory is provided but category is not, use subcategory as category
    if (bang.sc && !bang.c) bang.c = bang.sc;
    
    // Call the onSave callback
    this.onSave(bang, this.isEditMode);
    
    // Close the modal
    this.hide();
  }
  
  /**
   * Shows an error message
   */
  public showError(message: string, inputToFocus?: HTMLInputElement | null): void {
    if (!this.errorMessage) return;
    
    this.errorMessage.textContent = message;
    this.errorMessage.style.display = 'block';
    
    // Focus the input if provided
    if (inputToFocus) {
      inputToFocus.focus();
    }
  }
  
  /**
   * Hides the error message
   */
  public hideError(): void {
    if (!this.errorMessage) return;
    
    this.errorMessage.textContent = '';
    this.errorMessage.style.display = 'none';
  }
  
  /**
   * Validates the form and shows error messages
   */
  private validateForm(): boolean {
    // Reset any previous error
    this.hideError();
    
    // Check if trigger is provided
    if (!this.triggerInput?.value.trim()) {
      this.showError('Trigger is required', this.triggerInput);
      return false;
    }
    
    // Check if service name is provided
    if (!this.serviceInput?.value.trim()) {
      this.showError('Service name is required', this.serviceInput);
      return false;
    }
    
    // Check if domain is provided
    if (!this.domainInput?.value.trim()) {
      this.showError('Domain is required', this.domainInput);
      return false;
    }
    
    // Check if URL pattern is provided
    if (!this.urlPatternInput?.value.trim()) {
      this.showError('URL pattern is required', this.urlPatternInput);
      return false;
    }
    
    // Check if URL pattern contains {searchTerms} placeholder
    if (!this.urlPatternInput?.value.includes('{searchTerms}')) {
      this.showError('URL pattern must include {searchTerms} placeholder', this.urlPatternInput);
      return false;
    }
    
    return true;
  }
} 