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
        // No custom overrides needed - MainModal handles the base style now
    }

    private createContent(): void {
        const content = createElement('div', {
            className: 'space-y-6'
        });
        
        // Header area with description and Add button
        const headerArea = createElement('div', {
            className: 'flex flex-col sm:flex-row sm:items-center justify-between gap-4'
        });

        const description = createElement('p', {
            className: 'text-white/60 text-sm leading-relaxed max-w-sm'
        }, ['Create custom shortcuts that override defaults.']);
        
        const addButton = createElement('button', {
            className: 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-medium shadow-lg shadow-purple-900/20 text-sm whitespace-nowrap',
            type: 'button'
        }, [
            createElement('span', { className: 'text-lg leading-none' }, ['+']),
            'Add Custom Bang'
        ]);
        addButton.addEventListener('click', () => {
            if (this.bangFormModal) {
                this.bangFormModal.show();
            }
        });

        headerArea.append(description, addButton);
        
        // Bang list container
        this.bangList = createElement('div', {
            className: 'border border-white/10 rounded-lg overflow-hidden bg-white/5'
        });
        
        // Table header
        const tableHeader = createElement('div', {
            className: 'grid grid-cols-[120px_1fr_2fr_auto] gap-4 p-4 bg-white/5 border-b border-white/10 font-semibold text-white/70 text-xs uppercase tracking-wider'
        });
        tableHeader.innerHTML = `
            <span>Trigger</span>
            <span>Service</span>
            <span>URL Pattern</span>
            <span class="text-right">Actions</span>
        `;
        
        const tableBody = createElement('div', {
            className: 'max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent'
        });
        
        this.bangList.append(tableHeader, tableBody);
        this.bangListContainer = tableBody;
        
        content.append(headerArea, this.bangList);
        this.setContent(content);
        this.refreshBangList();
    }

  private bangListContainer: HTMLDivElement | null = null;

    private refreshBangList(): void {
        if (!this.bangListContainer) return;
        
        this.bangListContainer.innerHTML = '';
        
        if (!this.settings.customBangs || this.settings.customBangs.length === 0) {
            const emptyContainer = createElement('div', {
                className: 'flex flex-col items-center justify-center py-12 text-white/40 gap-3'
            });
            
            const icon = createElement('div', {
                className: 'text-4xl opacity-50'
            }, ['✨']);
            
            const text = createElement('p', {
                className: 'text-sm font-medium'
            }, ['No custom bangs yet']);
            
            const subtext = createElement('p', {
                className: 'text-xs'
            }, ['Add one to get started!']);
            
            emptyContainer.append(icon, text, subtext);
            this.bangListContainer.appendChild(emptyContainer);
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
            className: 'grid grid-cols-[120px_1fr_2fr_auto] gap-4 p-4 hover:bg-white/5 border-b border-white/5 last:border-b-0 items-center transition-colors'
        });
        
        // Format trigger
        const triggerText = Array.isArray(bang.t) 
            ? bang.t.map(t => `!${t}`).join(', ') 
            : `!${bang.t}`;
        const triggerCell = createElement('div', {
            className: 'font-mono text-[#a788ff] font-semibold text-sm truncate bg-[#a788ff]/10 px-2 py-1 rounded w-fit'
        }, [triggerText]);
        
        // Service
        const serviceCell = createElement('div', {
            className: 'text-white font-medium text-sm'
        }, [bang.s]);
        
        // URL
        const urlCell = createElement('div', {
            className: 'text-white/50 text-xs truncate font-mono'
        }, [bang.u]);
        
        // Actions
        const actionsCell = createElement('div', {
            className: 'flex items-center justify-end gap-2'
        });
        const editButton = createElement('button', {
            className: 'text-white/40 hover:text-white p-1.5 rounded transition-colors hover:bg-white/10',
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
            className: 'text-white/40 hover:text-red-400 p-1.5 rounded transition-colors hover:bg-red-500/10',
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