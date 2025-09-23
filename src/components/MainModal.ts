import { BaseModal } from './BaseModal';
import { createElement } from '../utils/dom';

export interface ModalConfig {
    title: string;
    maxWidth?: string;
    showCloseButton?: boolean;
    zIndex?: number;
    onClose?: () => void;
}

export interface ModalFooterButton {
    text: string;
    type: 'primary' | 'secondary';
    onClick: () => void;
}

export class MainModal extends BaseModal {
    protected config: ModalConfig;
    protected contentElement: HTMLDivElement | null = null;
    protected footerElement: HTMLDivElement | null = null;
    protected headerElement: HTMLDivElement | null = null;
    protected errorMessageElement: HTMLDivElement | null = null;
    
    constructor(config: ModalConfig) {
        super();
        this.config = {
            showCloseButton: true,
            maxWidth: 'md',
            zIndex: 50,
            ...config
        };
    }
    
    protected createModal(): void {
        // Create overlay
        this.overlay = createElement('div', {
            className: `fixed inset-0 bg-black/60 backdrop-blur-sm z-[${this.config.zIndex}] flex items-center justify-center transition-opacity duration-300`,
            style: 'opacity: 0;'
        });
        
        // Create modal - Make it a flex column
        this.modal = createElement('div', {
            className: `bg-[#120821] border border-white/10 rounded-lg shadow-xl w-full max-w-${this.config.maxWidth} flex flex-col max-h-[95vh] transition-transform duration-300`,
            style: 'transform: translateY(20px);'
        });
        
        // Create error message container
        this.errorMessageElement = createElement('div', {
            className: 'hidden bg-red-500/20 border border-red-500/40 text-white px-4 py-3 rounded flex-shrink-0',
            style: 'margin: 0 1rem; display: none;'
        });
        
        // Create modal header - Ensure it doesn't shrink
        this.headerElement = this.createHeader();
        this.headerElement.classList.add('flex-shrink-0');
        
        // Create content container - Make it grow and scroll
        this.contentElement = createElement('div', {
            className: 'flex-grow overflow-y-auto min-h-0'
        });
        
        // Create footer container - Ensure it doesn't shrink
        this.footerElement = createElement('div', {
            className: 'bg-black/30 px-6 flex justify-end gap-2 flex-shrink-0'
        });
        
        // Assemble modal using the flex layout
        this.modal.append(this.headerElement, this.errorMessageElement, this.contentElement, this.footerElement);
        this.overlay.appendChild(this.modal);
        
        // Close when clicking overlay (not the modal itself)
        this.overlay.addEventListener('click', (e: MouseEvent) => {
            if (e.target === this.overlay) {
                this.hide();
                if (this.config.onClose) {
                    this.config.onClose();
                }
            }
        });
        
        // Add ESC key handler
        document.addEventListener('keydown', this.handleEscKey);
    }
    
    private createHeader(): HTMLDivElement {
        const header = createElement('div', {
            className: 'bg-gradient-to-r from-[#2a004d] to-[#1a0036] px-6 py-4 flex justify-between items-center'
        });
        
        const title = createElement('h2', {
            className: 'text-white text-xl font-bold'
        });
        title.textContent = this.config.title;
        
        header.appendChild(title);
        
        if (this.config.showCloseButton) {
            const closeButton = createElement('button', {
                className: 'w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-xl font-medium transition-all'
            });
            closeButton.textContent = '×';
            closeButton.addEventListener('click', () => {
                this.hide();
                if (this.config.onClose) {
                    this.config.onClose();
                }
            });
            
            header.appendChild(closeButton);
        }
        
        return header;
    }
    
    /**
     * Set content for the modal
     */
    public setContent(element: HTMLElement): void {
        if (!this.contentElement) return;
        
        // Clear existing content
        while (this.contentElement.firstChild) {
            this.contentElement.removeChild(this.contentElement.firstChild);
        }
        
        // Add new content - The element passed here (our contentWrapper from BangFormModal)
        // should now correctly fill the flex-grow space and handle its internal layout.
        // It might need its own padding now since we removed it from contentElement.
        this.contentElement.appendChild(element);
    }
    
    /**
     * Add buttons to the footer
     */
    public setFooterButtons(buttons: ModalFooterButton[]): void {
        if (!this.footerElement) return;
        
        // Clear existing buttons
        while (this.footerElement.firstChild) {
            this.footerElement.removeChild(this.footerElement.firstChild);
        }
        
        // Add new buttons
        buttons.forEach(button => {
            const buttonElement = createElement('button', {
                className: button.type === 'primary' 
                    ? 'bg-[#3a86ff] hover:bg-[#2a76ef] text-white px-4 py-2 rounded transition-colors' 
                    : 'bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded transition-colors',
                type: 'button'
            });
            buttonElement.textContent = button.text;
            buttonElement.addEventListener('click', button.onClick);
            
            this.footerElement?.appendChild(buttonElement);
        });
    }
    
    /**
     * Add helpful text instead of buttons in the footer
     */
    public setFooterText(text: string): void {
        if (!this.footerElement) return;
        
        // Clear existing content
        while (this.footerElement.firstChild) {
            this.footerElement.removeChild(this.footerElement.firstChild);
        }
        
        // Add text
        const helpText = createElement('p', {
            className: 'text-white/70 text-sm italic'
        });
        helpText.textContent = text;
        
        this.footerElement.appendChild(helpText);
    }
    
    /**
     * Show an error message in the modal
     */
    public showError(message: string): void {
        if (!this.errorMessageElement) return;
        
        this.errorMessageElement.textContent = message;
        this.errorMessageElement.style.display = 'block';
    }
    
    /**
     * Hide the error message
     */
    public hideError(): void {
        if (!this.errorMessageElement) return;
        
        this.errorMessageElement.style.display = 'none';
    }
    
    /**
     * Override hide method to also remove event listeners
     */
    public hide(): void {
        super.hide();
        
        // Give time for animation, then clean up
        setTimeout(() => {
            // Remove ESC key handler
            document.removeEventListener('keydown', this.handleEscKey);
            
            if (this.overlay && document.body.contains(this.overlay)) {
                document.body.removeChild(this.overlay);
            }
        }, 300);
    }
    
    /**
     * Create a standardized form group with label and description
     */
    protected createFormGroup(
        label: string,
        description: string,
        isRequired: boolean = false
    ): HTMLDivElement {
        const container = createElement('div', {
            className: 'mb-4'
        });
        
        const labelElement = createElement('label', {
            className: 'block text-white font-medium mb-1'
        });
        
        // Add label text
        const labelText = createElement('span');
        labelText.textContent = label;
        
        // Add required indicator if necessary
        if (isRequired) {
            const requiredMark = createElement('span', {
                className: 'text-red-500 ml-1'
            });
            requiredMark.textContent = '*';
            labelText.appendChild(requiredMark);
        }
        
        labelElement.appendChild(labelText);
        
        // Add description
        const descriptionElement = createElement('p', {
            className: 'text-white/60 text-sm mb-2'
        });
        descriptionElement.textContent = description;
        
        container.append(labelElement, descriptionElement);
        
        return container;
    }
}