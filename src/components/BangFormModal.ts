import { createElement } from "../utils/dom";
import { BangItem } from "../types/BangItem";
import { MainModal } from "./MainModal";

/**
 * Modal for adding or editing a bang
 */
export class BangFormModal extends MainModal {
  private onSave: (updatedBang: BangItem | null, originalBang: BangItem | null, isEdit: boolean) => void;
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
  
  constructor(onSave: (updatedBang: BangItem | null, originalBang: BangItem | null, isEdit: boolean) => void) {
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
    
    // Update modal styling to solid theme
    if (this.modal) {
      this.modal.className = `bg-[#180a22] border border-[#3a1a4a] rounded-none w-full max-w-${this.config.maxWidth} flex flex-col max-h-[95vh] transition-all duration-300`;
    }
    if (this.headerElement) {
      this.headerElement.className = 'rounded-t-md bg-[#250c32] border-b border-[#3a1a4a] px-6 py-4 flex justify-between items-center flex-shrink-0';
    }
    if (this.footerElement) {
      this.footerElement.className = 'bg-[#250c32] border-t border-[#3a1a4a] px-6 py-4 flex justify-end gap-3 flex-shrink-0';
    }
    if (this.contentElement) {
      this.contentElement.className = 'flex-grow overflow-y-auto p-6 min-h-0 rounded-b-md';
    }
    
    // Error message container
    this.errorMessage = createElement('div', {
      className: 'bg-red-600/20 border border-red-600/50 text-red-100 px-4 py-3 mb-4 rounded flex-shrink-0',
      style: 'display: none;'
    });
    
    // Scrollable content container for the form
    const formContent = createElement('div', {
      className: 'px-6 py-4 overflow-y-auto flex-grow'
    });
    formContent.append(this.createBangForm());
    
    // Wrapper for error message and scrollable form content
    const contentWrapper = createElement('div', {
        className: 'flex flex-col overflow-hidden h-full min-h-0'
    });
    contentWrapper.append(this.errorMessage, formContent);
    
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
      className: 'space-y-6'
    }) as HTMLFormElement;
    
    // Prevent form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveBang();
    });
    
    // Create a three-column layout for the main fields
    const mainFieldsContainer = createElement('div', {
      className: 'grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'
    });
    
    // Bang trigger (shortcut)
    const triggerGroup = this.createFormGroup(
      'Trigger',
      'What you type after the bang prefix',
      true
    );
    
    this.triggerInput = createElement('input', {
      type: 'text',
      className: 'w-full px-3 py-2 bg-[#250c32] hover:bg-[#3a1a4a] placeholder-gray-400 border border-[#3a1a4a] focus:border-[#7c3aed] focus:outline-none transition-all text-white rounded-md',
      placeholder: 'e.g., g, google',
      autocomplete: 'off',
      spellcheck: 'false',
      maxlength: '20',
      required: 'true'
    }) as HTMLInputElement;
    
    if (this.isEditMode) {
      this.triggerInput.readOnly = true;
      this.triggerInput.className += ' opacity-70 cursor-not-allowed bg-gray-700';
    }
    
    this.triggerInput.addEventListener('input', () => {
      if (this.triggerInput) {
        this.triggerInput.value = this.triggerInput.value.replace(/[^a-zA-Z0-9_]/g, '');
      }
    });
    
    triggerGroup.lastChild?.appendChild(this.triggerInput);
    
    // Service name
    const serviceGroup = this.createFormGroup(
      'Service Name',
      'Name of the service',
      true
    );
    
    this.serviceInput = createElement('input', {
      type: 'text',
      className: 'w-full px-3 py-2 bg-[#250c32] hover:bg-[#3a1a4a] placeholder-gray-400 border border-[#3a1a4a] focus:border-[#7c3aed] focus:outline-none transition-all text-white rounded-md',
      placeholder: 'e.g., Google Maps',
      autocomplete: 'off',
      required: 'true'
    }) as HTMLInputElement;
    
    serviceGroup.lastChild?.appendChild(this.serviceInput);
    
    // Domain
    const domainGroup = this.createFormGroup(
      'Domain',
      'Domain of the service',
      true
    );
    
    this.domainInput = createElement('input', {
      type: 'text',
      className: 'w-full px-3 py-2 bg-[#250c32] hover:bg-[#3a1a4a] placeholder-gray-400 border border-[#3a1a4a] focus:border-[#7c3aed] focus:outline-none transition-all text-white rounded-md',
      placeholder: 'e.g., maps.google.com',
      autocomplete: 'off',
      required: 'true'
    }) as HTMLInputElement;
    
    domainGroup.lastChild?.appendChild(this.domainInput);
    
    mainFieldsContainer.append(triggerGroup, serviceGroup, domainGroup);
    form.appendChild(mainFieldsContainer);
    
    // Category and Subcategory
    const categoryContainer = createElement('div', {
      className: 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'
    });
    
    const categoryGroup = this.createFormGroup(
      'Category',
      'Optional category for organization',
      false
    );
    
    this.categoryInput = createElement('input', {
      type: 'text',
      className: 'w-full px-3 py-2 bg-[#250c32] hover:bg-[#3a1a4a] placeholder-gray-400 border border-[#3a1a4a] focus:border-[#7c3aed] focus:outline-none transition-all text-white rounded-md',
      placeholder: 'e.g., maps',
      autocomplete: 'off'
    }) as HTMLInputElement;
    
    categoryGroup.lastChild?.appendChild(this.categoryInput);
    
    const subcategoryGroup = this.createFormGroup(
      'Subcategory',
      'Optional subcategory for further classification',
      false
    );
    
    this.subcategoryInput = createElement('input', {
      type: 'text',
      className: 'w-full px-3 py-2 bg-[#250c32] hover:bg-[#3a1a4a] placeholder-gray-400 border border-[#3a1a4a] focus:border-[#7c3aed] focus:outline-none transition-all text-white rounded-md',
      placeholder: 'e.g., directions',
      autocomplete: 'off'
    }) as HTMLInputElement;
    
    subcategoryGroup.lastChild?.appendChild(this.subcategoryInput);
    
    categoryContainer.append(categoryGroup, subcategoryGroup);
    form.appendChild(categoryContainer);
    
    // URL Pattern
    const urlPatternGroup = this.createFormGroup(
      'URL Pattern',
      'URL with {searchTerms} as placeholder for the search query',
      true
    );
    
    this.urlPatternInput = createElement('input', {
      type: 'text',
      className: 'w-full px-3 py-2 bg-[#250c32] hover:bg-[#3a1a4a] placeholder-gray-400 border border-[#3a1a4a] focus:border-[#7c3aed] focus:outline-none transition-all text-white font-mono text-sm rounded-md',
      placeholder: 'https://maps.google.com/maps?q={searchTerms}',
      autocomplete: 'off',
      required: 'true'
    }) as HTMLInputElement;
    
    urlPatternGroup.lastChild?.appendChild(this.urlPatternInput);
    form.appendChild(urlPatternGroup);
    
    // Help text about the URL pattern
    const helpText = createElement('div', {
      className: 'text-gray-400 text-xs mt-2 border-t border-[#3a1a4a] pt-3'
    }, ['Use {searchTerms} as a placeholder for the search query. Example: https://example.com/search?q={searchTerms}']);
    
    form.appendChild(helpText);
    
    return form;
  }
  
  /**
   * Creates a form group with label and description - updated for minimal theme
   */
  protected createFormGroup(
    label: string,
    description: string,
    isRequired: boolean
  ): HTMLDivElement {
    const group = createElement('div', {
      className: 'flex flex-col h-full space-y-2'
    });
    
    const labelElement = createElement('label', {
      className: 'block text-gray-300 text-sm font-medium'
    });
    
    // Label text with optional required indicator
    const labelText = createElement('span', {}, [label]);
    labelElement.appendChild(labelText);
    
    if (isRequired) {
      const requiredIndicator = createElement('span', {
        className: 'text-red-400 ml-1'
      }, ['*']);
      labelElement.appendChild(requiredIndicator);
    }
    
    // Description
    const descriptionElement = createElement('p', {
      className: 'text-gray-400 text-xs'
    }, [description]);
    
    // Input container
    const inputContainer = createElement('div', {
      className: 'flex-grow'
    });
    
    group.append(labelElement, descriptionElement, inputContainer);
    
    return group;
  }
  
  /**
   * Populates the form fields with bang data
   */
  private populateFormFields(bang: BangItem): void {
    if (this.triggerInput) {
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
    if (!this.validateForm()) {
      return;
    }
    
    const triggerValue = this.triggerInput?.value.trim() || '';
    const triggers = triggerValue.split(',').map(t => t.trim()).filter(t => t !== '');
    
    const bang: BangItem = {
      t: triggers.length > 1 ? triggers : triggers[0] || '',
      s: this.serviceInput?.value.trim() || '',
      d: this.domainInput?.value.trim() || '',
      c: this.categoryInput?.value.trim() || undefined,
      sc: this.subcategoryInput?.value.trim() || undefined,
      r: this.originalBang?.r || 9999,
      u: this.urlPatternInput?.value.trim() || ''
    };
    
    if (bang.c === '') bang.c = undefined;
    if (bang.sc === '') bang.sc = undefined;
    if (bang.sc && !bang.c) bang.c = bang.sc;
    
    this.onSave(bang, this.originalBang, this.isEditMode);
    this.hide();
  }
  
  /**
   * Shows an error message
   */
  public showError(message: string, inputToFocus?: HTMLInputElement | null): void {
    if (!this.errorMessage) return;
    
    this.errorMessage.textContent = message;
    this.errorMessage.style.display = 'block';
    
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
    this.hideError();
    
    if (!this.triggerInput?.value.trim()) {
      this.showError('Trigger is required', this.triggerInput);
      return false;
    }
    
    if (!this.serviceInput?.value.trim()) {
      this.showError('Service name is required', this.serviceInput);
      return false;
    }
    
    if (!this.domainInput?.value.trim()) {
      this.showError('Domain is required', this.domainInput);
      return false;
    }
    
    if (!this.urlPatternInput?.value.trim()) {
      this.showError('URL pattern is required', this.urlPatternInput);
      return false;
    }
    
    if (!this.urlPatternInput?.value.includes('{searchTerms}')) {
      this.showError('URL pattern must include {searchTerms} placeholder', this.urlPatternInput);
      return false;
    }
    
    return true;
  }
} 