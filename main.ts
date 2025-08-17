import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginManifest, TFile } from 'obsidian';
import { AutoTitleSettings, DEFAULT_SETTINGS } from './settings';
import { AutoTitleSettingTab } from './SettingTab';
import { generateTitle, showNotice } from './utils';
import { TitleManager } from './TitleManager';
import { MigrationService } from './MigrationService';

export default class AutoTitlePlugin extends Plugin {
  settings: AutoTitleSettings;
  private typingTimer: NodeJS.Timeout | null = null;
  private isGenerating = false;
  private generatedCountForFile: Map<string, number> = new Map();
  private rejectedFiles: Set<string> = new Set();
  private temporaryRejectedFiles: Map<string, number> = new Map(); // filepath -> timestamp
  private statusBarItem: HTMLElement | null = null;
  private indicatorTimer: NodeJS.Timeout | null = null;
  private titleManager: TitleManager;
  private migrationService: MigrationService;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
  }

  async onload() {
    console.log('Loading AutoTitle plugin');

    await this.loadSettings();
    
    // Initialize TitleManager
    this.titleManager = new TitleManager(this.app);
    this.titleManager.setSettings(this.settings);
    
    // Initialize MigrationService
    this.migrationService = new MigrationService(this.app, this.titleManager);

    // Add ribbon button
    this.addRibbonIcon('heading', 'Generate Title', (evt: MouseEvent) => {
      this.generateTitleForActiveNote();
    });

    // Add command
    this.addCommand({
      id: 'generate-title',
      name: 'Generate title (with confirmation)',
      callback: () => {
        this.generateTitleForActiveNote();
      },
      hotkeys: [
        {
          modifiers: ['Ctrl', 'Shift'],
          key: 'h'
        }
      ]
    });


    // Add direct generation command without confirmation
    this.addCommand({
      id: 'generate-title-direct',
      name: 'Generate title (direct, no confirmation)',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        this.generateTitleDirect(editor, view);
      },
      hotkeys: [
        {
          modifiers: ['Ctrl', 'Shift', 'Alt'],
          key: 'h'
        }
      ]
    });



    // Add settings tab
    this.addSettingTab(new AutoTitleSettingTab(this.app, this));

    // Add status bar item
    this.statusBarItem = this.addStatusBarItem();
    this.updateStatusBar();

    // Register editor change handler for auto-generation
    this.registerAutoTrigger();

    // Add item to file context menu
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (file instanceof TFile && file.extension === 'md') {
          menu.addItem((item) => {
            item
              .setTitle('Generate Title with AI')
              .setIcon('heading')
              .onClick(() => {
                this.generateTitleForFile(file);
              });
          });
        }
      })
    );
  }

  onunload() {
    console.log('Unloading AutoTitle plugin');
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    if (this.indicatorTimer) {
      clearTimeout(this.indicatorTimer);
    }
  }

  private updateStatusBar() {
    if (!this.statusBarItem) return;
    
    const mode = this.settings.triggerMode;
    let text = '';
    
    switch (mode) {
      case 'manual':
        text = 'AutoTitle: Manual';
        break;
      case 'auto':
        text = 'AutoTitle: Auto';
        break;
      case 'semi-auto':
        text = 'AutoTitle: Semi-auto';
        break;
    }
    
    this.statusBarItem.setText(text);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    
    // Update TitleManager settings
    if (this.titleManager) {
      this.titleManager.setSettings(this.settings);
    }
    
    // Update status bar
    this.updateStatusBar();
    
    // Re-register auto trigger when settings change
    this.registerAutoTrigger();
  }

  private registerAutoTrigger() {
    // Remove previous handlers
    this.app.workspace.off('editor-change', this.handleEditorChange);
    
    if (this.settings.triggerMode !== 'manual') {
      this.registerEvent(
        this.app.workspace.on('editor-change', this.handleEditorChange.bind(this))
      );
    }
  }

  private handleEditorChange(editor: Editor, view: MarkdownView) {
    if (this.isGenerating) {
      return;
    }
    
    // Don't trigger auto-generation if limit reached for this note
    const file = view?.file;
    if (file) {
      // Check if we can show suggestion for this note
      if (!this.canShowSuggestionForFile(file.path)) {
        return;
      }
      
      const currentCount = this.generatedCountForFile.get(file.path) || 0;
      if (currentCount >= this.settings.generationCount) {
        return;
      }
    }
    
    // Reset previous timer and indicator
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    if (this.indicatorTimer) {
      clearTimeout(this.indicatorTimer);
    }
    
    const content = editor.getValue();
    if (!content || content.trim().length < this.settings.minContentLength) {
      return;
    }

    // Check if there's already a title
    const lines = content.split('\n');
    const firstLine = lines[0]?.trim();
    if (firstLine && firstLine.startsWith('#') && !this.settings.replaceMode) {
      return;
    }

    if (this.settings.triggerMode === 'auto') {
      // Automatic mode - start generation after pause
      this.typingTimer = setTimeout(() => {
        this.autoGenerateTitle(editor, view);
      }, this.settings.timeout);
      
      // Show indicator if enabled
      if (this.settings.showIndicator) {
        this.indicatorTimer = setTimeout(() => {
          this.showGenerationIndicator();
        }, this.settings.timeout - 1000);
      }
    } else if (this.settings.triggerMode === 'semi-auto') {
      // Semi-automatic mode - show indicator and manual trigger button
      this.typingTimer = setTimeout(() => {
        this.showManualTriggerButton(editor, view);
      }, this.settings.timeout);
    }
  }

  private async autoGenerateTitle(editor: Editor, view: MarkdownView) {
    if (this.isGenerating) {
      return;
    }
    
    const content = editor.getValue();
    if (!content || content.trim().length < this.settings.minContentLength) {
      return;
    }
    
    // Check if there's already a title
    const lines = content.split('\n');
    const firstLine = lines[0]?.trim();
    
    // If first line is already a title and replace mode is off, don't generate
    if (firstLine && firstLine.startsWith('#') && !this.settings.replaceMode) {
      return;
    }
    
    // Don't run auto-generation if limit reached for this note
    const file = view?.file;
    if (file) {
      // Check if we can show suggestion for this note
      if (!this.canShowSuggestionForFile(file.path)) {
        return;
      }
      
      const currentCount = this.generatedCountForFile.get(file.path) || 0;
      if (currentCount >= this.settings.generationCount) {
        return;
      }
    }
    
    try {
      this.isGenerating = true;
      this.hideGenerationIndicator();
      
      const suggestedTitle = await generateTitle(
        content,
        this.settings.apiKey,
        this.settings.model,
        this.settings.temperature,
        this.settings.language,
        this.settings.includeExistingTitle
      );
      
      if (this.settings.replaceMode) {
        await this.replaceTitle(editor, suggestedTitle, view);
        showNotice(`Title updated: "${suggestedTitle}"`);
        // Increment generation counter for this note
        if (file) {
          const currentCount = this.generatedCountForFile.get(file.path) || 0;
          this.generatedCountForFile.set(file.path, currentCount + 1);
        }
      } else {
        this.showTitleSuggestionModal(editor, view, suggestedTitle);
      }
    } catch (error) {
      console.error('Auto-generation error:', error);
      // Don't show error for auto-generation to avoid disturbing user
    } finally {
      this.isGenerating = false;
    }
  }

  private showGenerationIndicator() {
    if (!this.settings.showIndicator) return;
    
    // Create popup notification about upcoming generation
    const notice = new Notice('Generating title in 1 second...', 2000);
    
    // Add cancel button
    const noticeEl = notice.noticeEl;
    const cancelButton = noticeEl.createEl('button', { text: 'Cancel' });
    cancelButton.style.marginLeft = '10px';
    cancelButton.onclick = () => {
      if (this.typingTimer) {
        clearTimeout(this.typingTimer);
      }
      notice.hide();
    };
  }

  private hideGenerationIndicator() {
    // This method can be used to hide indicators
    // In current implementation indicators disappear automatically
  }

  private showManualTriggerButton(editor: Editor, view: MarkdownView) {
    // Create popup notification with manual trigger button
    const notice = new Notice('', 5000);
    const noticeEl = notice.noticeEl;
    noticeEl.innerHTML = '';
    
    const texts = this.getLocalizedTexts();
    
    const text = noticeEl.createEl('span', { text: texts.readyToGenerate });
    const generateButton = noticeEl.createEl('button', { text: texts.generate });
    generateButton.style.marginLeft = '10px';
    generateButton.style.backgroundColor = 'var(--interactive-accent)';
    generateButton.style.color = 'var(--text-on-accent)';
    generateButton.style.border = 'none';
    generateButton.style.padding = '4px 8px';
    generateButton.style.borderRadius = '3px';
    generateButton.style.cursor = 'pointer';
    generateButton.style.whiteSpace = 'nowrap';
    
    generateButton.onclick = () => {
      notice.hide();
      this.autoGenerateTitle(editor, view);
    };
    
    const cancelButton = noticeEl.createEl('button', { text: texts.cancel });
    cancelButton.style.marginLeft = '5px';
    cancelButton.style.whiteSpace = 'nowrap';
    cancelButton.onclick = () => {
      notice.hide();
      // Add file to temporarily rejected list (default)
      const file = view?.file;
      if (file) {
        this.addTemporaryRejection(file.path);
      }
    };
  }

  private async generateTitleForActiveNote() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      showNotice('Open a note to generate title');
      return;
    }

    const editor = activeView.editor;
    await this.generateTitleForEditor(editor, activeView);
  }

  private async generateTitleForEditor(editor: Editor, view: MarkdownView) {
    if (this.isGenerating) {
      showNotice('Title generation is already running...');
      return;
    }

    const content = editor.getValue();
    if (!content || content.trim().length < 10) {
      showNotice('Insufficient content for title generation');
      return;
    }

    if (!this.settings.apiKey) {
      showNotice('Configure OpenAI API key in plugin settings');
      return;
    }

    try {
      this.isGenerating = true;
      showNotice('Generating title...', 2000);

      const suggestedTitle = await generateTitle(
        content,
        this.settings.apiKey,
        this.settings.model,
        this.settings.temperature,
        this.settings.language,
        this.settings.includeExistingTitle
      );

      this.showTitleSuggestionModal(editor, view, suggestedTitle);
    } catch (error) {
      console.error('Title generation error:', error);
      showNotice(`Error: ${error.message}`);
    } finally {
      this.isGenerating = false;
    }
  }

  private async generateTitleForFile(file: TFile) {
    const content = await this.app.vault.read(file);
    if (!content || content.trim().length < 10) {
      showNotice('Insufficient content for title generation');
      return;
    }

    if (!this.settings.apiKey) {
      showNotice('Configure OpenAI API key in plugin settings');
      return;
    }

    try {
      this.isGenerating = true;
      showNotice('Generating title...', 2000);

      const suggestedTitle = await generateTitle(
        content,
        this.settings.apiKey,
        this.settings.model,
        this.settings.temperature,
        this.settings.language,
        this.settings.includeExistingTitle
      );

      // Create modal window for confirmation
      new TitleSuggestionModal(this.app, suggestedTitle, async (accepted: boolean, editedTitle?: string) => {
        if (accepted) {
          const finalTitle = editedTitle || suggestedTitle;
          // Update file content
          const updatedContent = this.insertTitleIntoContent(content, finalTitle);
          await this.app.vault.modify(file, updatedContent);
          showNotice(`Title added to file: "${finalTitle}"`);
        }
      }, null, null, this).open();
    } catch (error) {
      console.error('Title generation error:', error);
      showNotice(`Error: ${error.message}`);
    } finally {
      this.isGenerating = false;
    }
  }

  private showTitleSuggestionModal(editor: Editor, view: MarkdownView, suggestedTitle: string) {
    new TitleSuggestionModal(this.app, suggestedTitle, async (accepted: boolean, editedTitle?: string, rejectType?: 'temporary' | 'permanent') => {
      const file = view?.file;
      if (accepted) {
        const finalTitle = editedTitle || suggestedTitle;
        await this.replaceTitle(editor, finalTitle, view);
        showNotice(`Title updated: "${finalTitle}"`);
        // Increment generation counter for this note
        if (file) {
          const currentCount = this.generatedCountForFile.get(file.path) || 0;
          this.generatedCountForFile.set(file.path, currentCount + 1);
        }
        // Rename file if possible
        if (view.file) {
          this.renameFile(view.file, finalTitle);
        }
      } else {
        // User rejected suggestion
        if (file) {
          if (rejectType === 'permanent') {
            this.rejectedFiles.add(file.path);
          } else if (rejectType === 'temporary') {
            this.addTemporaryRejection(file.path);
          } else {
            // Default - temporary rejection
            this.addTemporaryRejection(file.path);
          }
        }
      }
    }, editor, view, this).open();
  }

  private async replaceTitle(editor: Editor, newTitle: string, view: MarkdownView) {
    const file = view?.file;
    if (!file) {
      // Fallback to old method if file is unavailable
      console.warn('File unavailable, using fallback method');
      this.replaceTitleFallback(editor, newTitle);
      return;
    }

    try {
      // Use TitleManager to set title without duplication
      const result = await this.titleManager.applyTitleWithoutDuplication(editor, file, newTitle);
      
      if (!result.success) {
        console.warn('Failed to apply title via TitleManager, using fallback:', result.error);
        this.replaceTitleFallback(editor, newTitle);
        
        // Show warning to user only in case of critical error
        if (result.error && result.error.includes('critical')) {
          showNotice(`Warning: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Error applying title:', error);
      // Fallback to old method on error
      this.replaceTitleFallback(editor, newTitle);
      
      // Show error to user only if fallback also failed
      try {
        // Check that fallback worked
        const content = editor.getValue();
        if (!content.includes(newTitle)) {
          showNotice('Failed to set title. Please try again.');
        }
      } catch (fallbackError) {
        showNotice('Critical error setting title');
      }
    }
  }

  private replaceTitleFallback(editor: Editor, newTitle: string) {
    const content = editor.getValue();
    const lines = content.split('\n');
    
    // Проверяем, есть ли уже заголовок в первой строке
    if (lines[0] && lines[0].trim().startsWith('#')) {
      // Заменяем существующий заголовок
      lines[0] = `# ${newTitle}`;
    } else {
      // Добавляем новый заголовок в начало
      lines.unshift(`# ${newTitle}`, '');
    }
    
    editor.setValue(lines.join('\n'));
  }

  private insertTitleIntoContent(content: string, title: string): string {
    // Используем ContentProcessor для очистки дублированных заголовков
    // Вместо добавления заголовка в содержимое, просто очищаем существующие дубликаты
    return this.titleManager.removeDuplicateTitle(content, title);
  }

  private async renameFile(file: TFile, newTitle: string) {
    try {
      // Очищаем заголовок от недопустимых символов для имени файла
      const sanitizedTitle = newTitle
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 100); // Ограничиваем длину

      if (sanitizedTitle && sanitizedTitle !== file.basename) {
        const newPath = file.path.replace(file.name, `${sanitizedTitle}.md`);
        
        // Проверяем, не существует ли уже файл с таким именем
        const existingFile = this.app.vault.getAbstractFileByPath(newPath);
        if (!existingFile) {
          await this.app.fileManager.renameFile(file, newPath);
          showNotice(`Файл переименован: "${sanitizedTitle}"`);
        }
      }
    } catch (error) {
      console.error('Ошибка переименования файла:', error);
      // Не показываем ошибку пользователю, так как это не критично
    }
  }

  private async generateTitleDirect(editor: Editor, view: MarkdownView) {
    if (this.isGenerating) {
      showNotice('Title generation is already running...');
      return;
    }

    const content = editor.getValue();
    if (!content || content.trim().length < 10) {
      showNotice('Insufficient content for title generation');
      return;
    }

    if (!this.settings.apiKey) {
      showNotice('Configure OpenAI API key in plugin settings');
      return;
    }

    try {
      this.isGenerating = true;
      showNotice('Generating title...', 2000);

      const suggestedTitle = await generateTitle(
        content,
        this.settings.apiKey,
        this.settings.model,
        this.settings.temperature,
        this.settings.language,
        this.settings.includeExistingTitle
      );

      // Apply title directly without confirmation
      await this.replaceTitle(editor, suggestedTitle, view);
      showNotice(`Title updated: "${suggestedTitle}"`);
      
      // Увеличиваем счетчик генераций для этой заметки
      const file = view?.file;
      if (file) {
        const currentCount = this.generatedCountForFile.get(file.path) || 0;
        this.generatedCountForFile.set(file.path, currentCount + 1);
      }
      
      // Переименовываем файл, если это возможно
      if (view.file) {
        this.renameFile(view.file, suggestedTitle);
      }
    } catch (error) {
      console.error('Title generation error:', error);
      showNotice(`Error: ${error.message}`);
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Показывает модальное окно подтверждения миграции
   */
  private async showMigrationConfirmationModal() {
    try {
      const stats = await this.migrationService.getDuplicationStatistics();
      
      if (stats.duplicated === 0) {
        showNotice('No duplicate titles found!');
        return;
      }

      new MigrationConfirmationModal(
        this.app,
        stats,
        async (confirmed: boolean) => {
          if (confirmed) {
            await this.runMigration();
          }
        }
      ).open();
    } catch (error) {
      console.error('Error checking for duplicate titles:', error);
      showNotice('Error checking notes');
    }
  }

  /**
   * Запускает миграцию всех заметок
   */
  private async runMigration() {
    try {
      showNotice('Starting duplicate title fix...');
      
      const result = await this.migrationService.fixAllDuplicatedTitles(true);
      
      if (result.errors.length > 0) {
        console.error('Migration errors:', result.errors);
        showNotice(`Migration completed with errors. Fixed: ${result.fixedFiles}, errors: ${result.errors.length}`);
      } else {
        showNotice(`Migration completed successfully! Fixed ${result.fixedFiles} notes.`);
      }
    } catch (error) {
      console.error('Migration error:', error);
      showNotice('Error during migration execution');
    }
  }

  /**
   * Исправляет дублированный заголовок в текущей заметке
   */
  private async fixCurrentNoteTitle(view: MarkdownView) {
    if (!view.file) {
      showNotice('No active note');
      return;
    }

    try {
      const wasFixed = await this.migrationService.fixNoteTitle(view.file);
      
      if (wasFixed) {
        showNotice('Duplicate title removed from note');
      } else {
        showNotice('This note has no duplicate title');
      }
    } catch (error) {
      console.error('Note fix error:', error);
      showNotice('Error fixing note');
    }
  }

  /**
   * Public method to fix all duplicated titles (for settings UI)
   */
  async fixAllDuplicatedTitles() {
    await this.runMigration();
  }

  /**
   * Public method to fix current note title (for settings UI)
   */
  async fixCurrentNoteTitleFromSettings() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      await this.fixCurrentNoteTitle(activeView);
    } else {
      showNotice('No active note');
    }
  }

  /**
   * Public method to reset rejected files (for settings UI)
   */
  resetRejectedFiles() {
    this.rejectedFiles.clear();
    this.temporaryRejectedFiles.clear();
    showNotice('Rejected files list cleared. Auto-generation is now available for all notes again.');
  }

  /**
   * Public method to get rejected files count (for settings UI)
   */
  getRejectedFilesCount(): number {
    return this.rejectedFiles.size + this.temporaryRejectedFiles.size;
  }

  /**
   * Проверяет, можно ли показать предложение для файла
   */
  private canShowSuggestionForFile(filePath: string): boolean {
    // Проверяем постоянные отказы
    if (this.rejectedFiles.has(filePath)) {
      return false;
    }

    // Проверяем временные отказы
    const temporaryRejectTime = this.temporaryRejectedFiles.get(filePath);
    if (temporaryRejectTime) {
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000; // 5 минут в миллисекундах
      
      if (now - temporaryRejectTime < fiveMinutes) {
        return false; // Еще не прошло 5 минут
      } else {
        // Время истекло, удаляем из временных отказов
        this.temporaryRejectedFiles.delete(filePath);
      }
    }

    return true;
  }

  /**
   * Добавляет файл в список временно отклоненных
   */
  private addTemporaryRejection(filePath: string) {
    this.temporaryRejectedFiles.set(filePath, Date.now());
  }

  /**
   * Получает локализованные тексты для интерфейса
   */
  getLocalizedTexts() {
    const isRussian = this.settings.language === 'ru' || 
                     (this.settings.language === 'auto' && 
                      (navigator.language.startsWith('ru') || 
                       document.documentElement.lang?.startsWith('ru')));

    if (isRussian) {
      return {
        suggestedTitle: 'Suggested Title',
        accept: 'Accept',
        reject: 'Reject',
        rejectTemporary: 'Reject for 5 min',
        rejectPermanent: 'Don\'t remind again',
        regenerate: 'Generate Another',
        readyToGenerate: 'Ready to generate title. ',
        generate: 'Generate',
        cancel: 'Cancel'
      };
    } else {
      return {
        suggestedTitle: 'Suggested Title',
        accept: 'Accept',
        reject: 'Reject',
        rejectTemporary: 'Reject for 5 min',
        rejectPermanent: 'Don\'t remind again',
        regenerate: 'Generate Another',
        readyToGenerate: 'Ready to generate title. ',
        generate: 'Generate',
        cancel: 'Cancel'
      };
    }
  }
}

class TitleSuggestionModal extends Modal {
  private suggestedTitle: string;
  private onResult: (accepted: boolean, editedTitle?: string, rejectType?: 'temporary' | 'permanent') => void;
  private editor: Editor | null;
  private view: MarkdownView | null;
  private plugin: AutoTitlePlugin;
  private titleInput: HTMLTextAreaElement;

  constructor(app: App, suggestedTitle: string, onResult: (accepted: boolean, editedTitle?: string, rejectType?: 'temporary' | 'permanent') => void, editor: Editor | null, view: MarkdownView | null, plugin: AutoTitlePlugin) {
    super(app);
    this.suggestedTitle = suggestedTitle;
    this.onResult = onResult;
    this.editor = editor;
    this.view = view;
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    // Получаем локализованные тексты
    const texts = this.plugin.getLocalizedTexts();

    contentEl.createEl('h2', { text: texts.suggestedTitle });
    
    const inputContainer = contentEl.createDiv();
    inputContainer.style.margin = '20px 0';
    
    this.titleInput = inputContainer.createEl('textarea', {
      cls: 'suggested-title-input'
    });
    this.titleInput.value = this.suggestedTitle;
    this.titleInput.style.width = '100%';
    this.titleInput.style.minHeight = '60px';
    this.titleInput.style.fontSize = '1.2em';
    this.titleInput.style.fontWeight = 'bold';
    this.titleInput.style.padding = '10px';
    this.titleInput.style.border = '1px solid var(--background-modifier-border)';
    this.titleInput.style.borderRadius = '4px';
    this.titleInput.style.resize = 'vertical';
    this.titleInput.style.fontFamily = 'var(--font-interface)';
    this.titleInput.focus();

    const buttonsDiv = contentEl.createDiv({ cls: 'modal-button-container' });
    buttonsDiv.style.display = 'flex';
    buttonsDiv.style.gap = '8px';
    buttonsDiv.style.justifyContent = 'flex-end';
    buttonsDiv.style.marginTop = '20px';
    buttonsDiv.style.flexWrap = 'wrap';

    const regenerateButton = buttonsDiv.createEl('button', { text: texts.regenerate });
    regenerateButton.onclick = () => {
      this.regenerateTitle();
    };

    const acceptButton = buttonsDiv.createEl('button', { text: texts.accept });
    acceptButton.classList.add('mod-cta');
    acceptButton.onclick = () => {
      this.close();
      this.onResult(true, this.titleInput.value);
    };

    // Создаем выпадающее меню для отклонения
    const rejectDropdown = buttonsDiv.createEl('div');
    rejectDropdown.style.position = 'relative';
    rejectDropdown.style.display = 'inline-block';

    const rejectButton = rejectDropdown.createEl('button', { text: texts.reject + ' ▼' });
    rejectButton.style.whiteSpace = 'nowrap';
    
    const dropdownMenu = rejectDropdown.createEl('div');
    dropdownMenu.style.display = 'none';
    dropdownMenu.style.position = 'absolute';
    dropdownMenu.style.bottom = '100%';
    dropdownMenu.style.right = '0';
    dropdownMenu.style.backgroundColor = 'var(--background-primary)';
    dropdownMenu.style.border = '1px solid var(--background-modifier-border)';
    dropdownMenu.style.borderRadius = '4px';
    dropdownMenu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    dropdownMenu.style.zIndex = '1000';
    dropdownMenu.style.minWidth = '180px';

    const rejectTemporaryOption = dropdownMenu.createEl('div', { text: texts.rejectTemporary });
    rejectTemporaryOption.style.padding = '8px 12px';
    rejectTemporaryOption.style.cursor = 'pointer';
    rejectTemporaryOption.style.whiteSpace = 'nowrap';
    rejectTemporaryOption.onmouseenter = () => {
      rejectTemporaryOption.style.backgroundColor = 'var(--background-modifier-hover)';
    };
    rejectTemporaryOption.onmouseleave = () => {
      rejectTemporaryOption.style.backgroundColor = 'transparent';
    };
    rejectTemporaryOption.onclick = () => {
      this.close();
      this.onResult(false, undefined, 'temporary');
    };

    const rejectPermanentOption = dropdownMenu.createEl('div', { text: texts.rejectPermanent });
    rejectPermanentOption.style.padding = '8px 12px';
    rejectPermanentOption.style.cursor = 'pointer';
    rejectPermanentOption.style.whiteSpace = 'nowrap';
    rejectPermanentOption.onmouseenter = () => {
      rejectPermanentOption.style.backgroundColor = 'var(--background-modifier-hover)';
    };
    rejectPermanentOption.onmouseleave = () => {
      rejectPermanentOption.style.backgroundColor = 'transparent';
    };
    rejectPermanentOption.onclick = () => {
      this.close();
      this.onResult(false, undefined, 'permanent');
    };

    // Обработчик клика по кнопке отклонения
    rejectButton.onclick = (e) => {
      e.stopPropagation();
      const isVisible = dropdownMenu.style.display !== 'none';
      dropdownMenu.style.display = isVisible ? 'none' : 'block';
    };

    // Закрываем меню при клике вне его
    document.addEventListener('click', () => {
      dropdownMenu.style.display = 'none';
    });

    // Фокус на поле ввода без выделения
    this.titleInput.focus();
    // Устанавливаем курсор в конец текста вместо выделения всего
    this.titleInput.setSelectionRange(this.titleInput.value.length, this.titleInput.value.length);
  }

  private async regenerateTitle() {
    try {
      if (!this.editor || !this.view || !this.plugin) {
        new Notice('Unable to regenerate title');
        return;
      }
      
      this.titleInput.disabled = true;
      this.titleInput.value = 'Generating new title...';
      
      const content = this.editor.getValue();
      const newTitle = await generateTitle(
        content,
        this.plugin.settings.apiKey,
        this.plugin.settings.model,
        this.plugin.settings.temperature + 0.2, // Increase temperature for different style
        this.plugin.settings.language,
        this.plugin.settings.includeExistingTitle
      );
      
      this.suggestedTitle = newTitle;
      this.titleInput.value = newTitle;
      this.titleInput.disabled = false;
      this.titleInput.focus();
      // Set cursor at end of text instead of selecting all
      this.titleInput.setSelectionRange(this.titleInput.value.length, this.titleInput.value.length);
    } catch (error) {
      console.error('Error regenerating title:', error);
      this.titleInput.value = this.suggestedTitle;
      this.titleInput.disabled = false;
      new Notice('Error regenerating title');
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

class MigrationConfirmationModal extends Modal {
  private stats: {total: number, duplicated: number, percentage: number};
  private onResult: (confirmed: boolean) => void;

  constructor(app: App, stats: {total: number, duplicated: number, percentage: number}, onResult: (confirmed: boolean) => void) {
    super(app);
    this.stats = stats;
    this.onResult = onResult;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: 'Fix Duplicate Titles' });
    
    const infoDiv = contentEl.createDiv();
    infoDiv.style.margin = '20px 0';
    
    infoDiv.createEl('p', { 
      text: `Found ${this.stats.duplicated} notes with duplicate titles out of ${this.stats.total} total notes (${this.stats.percentage}%).`
    });
    
    infoDiv.createEl('p', { 
      text: 'This operation will remove duplicate H1 titles from note content, leaving titles only in file metadata.'
    });
    
    infoDiv.createEl('p', { 
      text: 'This operation is safe and will not affect other headers or note content.',
      cls: 'mod-warning'
    });

    const buttonsDiv = contentEl.createDiv({ cls: 'modal-button-container' });
    buttonsDiv.style.display = 'flex';
    buttonsDiv.style.gap = '10px';
    buttonsDiv.style.justifyContent = 'flex-end';
    buttonsDiv.style.marginTop = '20px';

    const confirmButton = buttonsDiv.createEl('button', { text: 'Fix Notes' });
    confirmButton.classList.add('mod-cta');
    confirmButton.onclick = () => {
      this.close();
      this.onResult(true);
    };

    const cancelButton = buttonsDiv.createEl('button', { text: 'Cancel' });
    cancelButton.onclick = () => {
      this.close();
      this.onResult(false);
    };
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
