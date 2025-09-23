import { createElement } from "../utils/dom";
import { BangItem } from "../types/BangItem";
import { UserSettings, loadSettings, saveSettings } from "../utils/settings";
import { BangFormModal } from "./BangFormModal";
import { clearBangFilterCache } from "../utils/bangCoreUtil";
import { MainModal } from "./MainModal";

/**
 * Modal for managing custom bangs
 */
export class CustomBangModal extends MainModal {
  private settings: UserSettings;
  private bangList: HTMLDivElement | null = null;
  private onSettingsChange: (settings: UserSettings) => void;
  private bangFormModal: BangFormModal | null = null;
  private confirmationDialog: HTMLDivElement | null = null;
  private pendingDeleteBang: BangItem | null = null;

  constructor(onSettingsChange: (settings: UserSettings) => void = () => {}) {
    super({
      title: 'Custom Bangs',
      maxWidth: 'md',
      showCloseButton: true,
      zIndex: 50
    });
    
    this.settings = loadSettings();
    this.onSettingsChange = onSettingsChange;
    this.bangFormModal = new BangFormModal(
      (updatedBang: BangItem | null, originalBangFromForm: BangItem | null, isEdit: boolean) => {
        this.handleBangSave(updatedBang, originalBangFromForm, isEdit);
      }
    );
  }

  public show(): void {
    super.show();
    this.createContent();
    if (this.bangList) {
      this.refreshBangList();
    }
  }

  protected createModal(): void {
    super.createModal();
    if (this.overlay) {
      this.overlay.className = `fixed inset-0 bg-black/60 z-[${this.config.zIndex}] flex items-center justify-center transition-opacity duration-300`;
    }
    if (this.modal) {
      this.modal.className = `bg-[#180a22] border border-[#3a1a4a] rounded-none w-full max-w-${this.config.maxWidth} flex flex-col max-h-[95vh] transition-all duration-300`;
    }
    if (this.headerElement) {
      this.headerElement.className = 'rounded-t-md bg-[#250c32] border-b border-[#3a1a4a] px-6 py-4 flex justify-between items-center flex-shrink-0';
    }
    if (this.contentElement) {
      this.contentElement.className = 'flex-grow overflow-y-auto p-6 min-h-0 rounded-b-md';
    }
  }

  private createContent(): void {
    const content = createElement('div', {
      className: 'space-y-6'
    });
    
    // Add button as prominent top action
    const addButtonContainer = createElement('div', {
      className: 'flex justify-end'
    });
    const addButton = createElement('button', {
      className: 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors font-medium',
      type: 'button'
    }, [
      createElement('span', { className: 'text-sm' }, ['+']),
      'Add Custom Bang'
    ]);
    addButton.addEventListener('click', () => {
      if (this.bangFormModal) {
        this.bangFormModal.show();
      }
    });
    addButtonContainer.appendChild(addButton);
    
    // Description
    const description = createElement('p', {
      className: 'text-gray-300 text-sm leading-relaxed'
    }, ['Create and manage your custom bang shortcuts. Custom bangs will override default bangs with the same shortcut.']);
    
    // Bang list container
    this.bangList = createElement('div', {
      className: 'border border-[#3a1a4a] rounded-md overflow-hidden'
    });
    
    // Table header
    const tableHeader = createElement('div', {
      className: 'grid grid-cols-[120px_1fr_2fr_auto] gap-4 p-4 bg-[#250c32] border-b border-[#3a1a4a] font-medium text-gray-300 text-sm uppercase tracking-wide'
    });
    tableHeader.innerHTML = `
      <span>Trigger</span>
      <span>Service</span>
      <span>URL Pattern</span>
      <span>Actions</span>
    `;
    
    const tableBody = createElement('div', {
      className: 'max-h-[40vh] overflow-y-auto'
    });
    
    this.bangList.append(tableHeader, tableBody);
    this.bangListContainer = tableBody; // Use a separate container for items
    
    content.append(addButtonContainer, description, this.bangList);
    this.setContent(content);
    this.refreshBangList();
  }

  private bangListContainer: HTMLDivElement | null = null;

  private refreshBangList(): void {
    if (!this.bangListContainer) return;
    
    this.bangListContainer.innerHTML = '';
    
    if (!this.settings.customBangs || this.settings.customBangs.length === 0) {
      const emptyMessage = createElement('div', {
        className: 'text-center py-8 text-gray-400'
      }, ['No custom bangs yet. Add one above to get started!']);
      this.bangListContainer.appendChild(emptyMessage);
      return;
    }
    
    // Sort bangs alphabetically by primary trigger
    const sortedBangs = [...this.settings.customBangs].sort((a, b) => {
      const triggerA = Array.isArray(a.t) ? a.t[0] : a.t;
      const triggerB = Array.isArray(b.t) ? b.t[0] : b.t;
      return triggerA.localeCompare(triggerB);
    });
    
    sortedBangs.forEach(bang => {
      const bangItem = this.createBangListItem(bang);
      this.bangListContainer!.appendChild(bangItem);
    });
  }

  private createBangListItem(bang: BangItem): HTMLDivElement {
    const item = createElement('div', {
      className: 'grid grid-cols-[120px_1fr_2fr_auto] gap-4 p-4 hover:bg-[#250c32] border-b border-[#3a1a4a] last:border-b-0 items-center'
    });
    
    // Format trigger
    const triggerText = Array.isArray(bang.t) 
      ? bang.t.map(t => `!${t}`).join(', ') 
      : `!${bang.t}`;
    const triggerCell = createElement('div', {
      className: 'font-mono text-[#7c3aed] font-semibold text-sm truncate'
    }, [triggerText]);
    
    // Service
    const serviceCell = createElement('div', {
      className: 'text-gray-300 font-medium text-sm'
    }, [bang.s]);
    
    // URL
    const urlCell = createElement('div', {
      className: 'text-gray-400 text-xs truncate leading-relaxed'
    }, [bang.u]);
    
    // Actions
    const actionsCell = createElement('div', {
      className: 'flex items-center gap-2'
    });
    const editButton = createElement('button', {
      className: 'text-gray-400 hover:text-[#7c3aed] p-2 rounded transition-colors hover:bg-[#250c32]',
      title: 'Edit',
      type: 'button'
    }, ['✏️']);
    editButton.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.bangFormModal) {
        this.bangFormModal.show(bang);
      }
    });
    const deleteButton = createElement('button', {
      className: 'text-gray-400 hover:text-red-400 p-2 rounded transition-colors hover:bg-[#250c32]',
      title: 'Delete',
      type: 'button'
    }, ['🗑️']);
    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteBang(bang);
    });
    actionsCell.append(editButton, deleteButton);
    
    item.append(triggerCell, serviceCell, urlCell, actionsCell);
    return item;
  }

  private normalizeTriggers(trigger: string | string[]): string[] {
    return (Array.isArray(trigger) ? trigger : [String(trigger)]).sort();
  }

  private handleBangSave(updatedBang: BangItem | null, originalBangFromForm: BangItem | null, isEdit: boolean): void {
    if (!updatedBang) return;

    if (!this.settings.customBangs) {
      this.settings.customBangs = [];
    }

    if (isEdit && originalBangFromForm) {
      const index = this.settings.customBangs.findIndex(existingBang => {
        const originalTriggers = this.normalizeTriggers(originalBangFromForm.t);
        const existingTriggers = this.normalizeTriggers(existingBang.t);
        const triggersMatch = originalTriggers.length === existingTriggers.length &&
                              originalTriggers.every((val, idx) => val === existingTriggers[idx]);
        return triggersMatch &&
               existingBang.s === originalBangFromForm.s &&
               existingBang.d === originalBangFromForm.d;
      });

      if (index !== -1) {
        this.settings.customBangs[index] = updatedBang;
      } else {
        console.error("Error editing bang: Original not found.");
        this.refreshBangList();
        return;
      }
    } else if (!isEdit) {
      this.settings.customBangs.push(updatedBang);
    } else {
      console.error("Error: Edit mode without original bang.");
      this.refreshBangList();
      return;
    }

    saveSettings(this.settings); // Add save for consistency
    this.onSettingsChange(this.settings);
    clearBangFilterCache();
    this.refreshBangList();
  }

  private showConfirmationDialog(message: string, onConfirm: () => void): void {
    if (this.confirmationDialog && document.body.contains(this.confirmationDialog)) {
      document.body.removeChild(this.confirmationDialog);
    }
    
    this.confirmationDialog = createElement('div', {
      className: 'fixed inset-0 bg-black/60 z-[70] flex items-center justify-center transition-opacity duration-200',
      style: 'opacity: 0;'
    });
    
    const dialogBox = createElement('div', {
      className: 'bg-[#180a22] border border-[#3a1a4a] rounded-md max-w-sm p-6 transition-all duration-200',
      style: 'transform: translateY(20px);'
    });
    
    const messageElement = createElement('p', {
      className: 'text-gray-200 text-base mb-6 leading-relaxed'
    }, [message]);
    
    const buttonsContainer = createElement('div', {
      className: 'flex justify-end gap-3 pt-2'
    });
    
    const cancelButton = createElement('button', {
      className: 'bg-[#250c32] hover:bg-[#3a1a4a] text-gray-200 px-4 py-2 rounded-md transition-colors border border-[#3a1a4a]',
      type: 'button'
    }, ['Cancel']);
    
    const confirmButton = createElement('button', {
      className: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors border border-red-600',
      type: 'button'
    }, ['Delete']);
    
    cancelButton.addEventListener('click', () => this.closeConfirmationDialog());
    confirmButton.addEventListener('click', () => {
      onConfirm();
      this.closeConfirmationDialog();
    });
    
    buttonsContainer.append(cancelButton, confirmButton);
    dialogBox.append(messageElement, buttonsContainer);
    this.confirmationDialog.appendChild(dialogBox);
    
    document.body.appendChild(this.confirmationDialog);
    
    setTimeout(() => {
      if (this.confirmationDialog) {
        this.confirmationDialog.style.opacity = '1';
        dialogBox.style.transform = 'translateY(0)';
      }
    }, 10);
    
    this.confirmationDialog.addEventListener('click', (e) => {
      if (e.target === this.confirmationDialog) {
        this.closeConfirmationDialog();
      }
    });
    
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeConfirmationDialog();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }
  
  private closeConfirmationDialog(): void {
    if (!this.confirmationDialog) return;
    
    this.confirmationDialog.style.opacity = '0';
    const dialogBox = this.confirmationDialog.querySelector('div');
    if (dialogBox) {
      dialogBox.style.transform = 'translateY(20px)';
    }
    
    setTimeout(() => {
      if (this.confirmationDialog && document.body.contains(this.confirmationDialog)) {
        document.body.removeChild(this.confirmationDialog);
        this.confirmationDialog = null;
      }
    }, 200);
  }

  private deleteBang(bang: BangItem): void {
    this.pendingDeleteBang = bang;
    
    const triggerText = Array.isArray(bang.t) 
      ? bang.t.map(t => `!${t}`).join(', ') 
      : `!${bang.t}`;
    
    this.showConfirmationDialog(
      `Are you sure you want to delete the ${triggerText} bang? This action cannot be undone.`,
      this.confirmDeleteBang.bind(this)
    );
  }
  
  private confirmDeleteBang(): void {
    if (!this.pendingDeleteBang || !this.settings.customBangs) return;
    
    this.settings.customBangs = this.settings.customBangs.filter(
      b => b.t !== this.pendingDeleteBang!.t
    );
    
    saveSettings(this.settings);
    this.onSettingsChange(this.settings);
    
    this.refreshBangList();
    this.pendingDeleteBang = null;
  }
} 