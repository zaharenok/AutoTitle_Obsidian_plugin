import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginManifest, TFile } from 'obsidian';
import { AutoTitleSettings, DEFAULT_SETTINGS } from './settings';
import { AutoTitleSettingTab } from './SettingTab';
import { generateTitle, showNotice } from './utils';

export default class AutoTitlePlugin extends Plugin {
  settings: AutoTitleSettings;
  private typingTimer: NodeJS.Timeout | null = null;
  private isGenerating = false;
  private generatedCountForFile: Map<string, number> = new Map();
  private statusBarItem: HTMLElement | null = null;
  private indicatorTimer: NodeJS.Timeout | null = null;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
  }

  async onload() {
    console.log('Загружается плагин AutoTitle');

    await this.loadSettings();

    // Добавляем кнопку в ленту
    this.addRibbonIcon('heading', 'Генерировать заголовок', (evt: MouseEvent) => {
      this.generateTitleForActiveNote();
    });

    // Добавляем команду
    this.addCommand({
      id: 'generate-title',
      name: 'Generate title for note',
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

    // Добавляем команду для редактора
    this.addCommand({
      id: 'generate-title-editor',
      name: 'Generate title (in editor)',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        this.generateTitleForEditor(editor, view);
      }
    });

    // Добавляем команду для прямой генерации без подтверждения
    this.addCommand({
      id: 'generate-title-direct',
      name: 'Generate title without confirmation',
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

    // Добавляем вкладку настроек
    this.addSettingTab(new AutoTitleSettingTab(this.app, this));

    // Добавляем элемент в статус-бар
    this.statusBarItem = this.addStatusBarItem();
    this.updateStatusBar();

    // Регистрируем обработчик изменений в редакторе для автоматической генерации
    this.registerAutoTrigger();

    // Добавляем элемент в контекстное меню файлов
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (file instanceof TFile && file.extension === 'md') {
          menu.addItem((item) => {
            item
              .setTitle('Генерировать заголовок с AI')
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
    console.log('Выгружается плагин AutoTitle');
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
    
    // Обновляем статус-бар
    this.updateStatusBar();
    
    // Перерегистрируем автотриггер при изменении настроек
    this.registerAutoTrigger();
  }

  private registerAutoTrigger() {
    // Снимаем предыдущие обработчики
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
    
    // Не запускать автогенерацию, если достигнут лимит генераций для этой заметки
    const file = view?.file;
    if (file) {
      const currentCount = this.generatedCountForFile.get(file.path) || 0;
      if (currentCount >= this.settings.generationCount) {
        return;
      }
    }
    
    // Сбрасываем предыдущий таймер и индикатор
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

    // Проверяем, есть ли уже заголовок
    const lines = content.split('\n');
    const firstLine = lines[0]?.trim();
    if (firstLine && firstLine.startsWith('#') && !this.settings.replaceMode) {
      return;
    }

    if (this.settings.triggerMode === 'auto') {
      // Автоматический режим - запускаем генерацию после паузы
      this.typingTimer = setTimeout(() => {
        this.autoGenerateTitle(editor, view);
      }, this.settings.timeout);
      
      // Показываем индикатор если включено
      if (this.settings.showIndicator) {
        this.indicatorTimer = setTimeout(() => {
          this.showGenerationIndicator();
        }, this.settings.timeout - 1000);
      }
    } else if (this.settings.triggerMode === 'semi-auto') {
      // Полуавтоматический режим - показываем индикатор и кнопку для ручного запуска
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
    
    // Проверяем, есть ли уже заголовок
    const lines = content.split('\n');
    const firstLine = lines[0]?.trim();
    
    // Если первая строка уже является заголовком и режим замены выключен, не генерируем
    if (firstLine && firstLine.startsWith('#') && !this.settings.replaceMode) {
      return;
    }
    
    // Не запускать автогенерацию, если достигнут лимит генераций для этой заметки
    const file = view?.file;
    if (file) {
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
        this.settings.language
      );
      
      if (this.settings.replaceMode) {
        this.replaceTitle(editor, suggestedTitle);
        showNotice(`Заголовок обновлен: "${suggestedTitle}"`);
        // Увеличиваем счетчик генераций для этой заметки
        if (file) {
          const currentCount = this.generatedCountForFile.get(file.path) || 0;
          this.generatedCountForFile.set(file.path, currentCount + 1);
        }
      } else {
        this.showTitleSuggestionModal(editor, view, suggestedTitle);
      }
    } catch (error) {
      console.error('Ошибка автогенерации заголовка:', error);
      // Не показываем ошибку для автогенерации, чтобы не мешать пользователю
    } finally {
      this.isGenerating = false;
    }
  }

  private showGenerationIndicator() {
    if (!this.settings.showIndicator) return;
    
    // Создаем всплывающее уведомление о предстоящей генерации
    const notice = new Notice('Генерация заголовка через 1 секунду...', 2000);
    
    // Добавляем кнопку отмены
    const noticeEl = notice.noticeEl;
    const cancelButton = noticeEl.createEl('button', { text: 'Отмена' });
    cancelButton.style.marginLeft = '10px';
    cancelButton.onclick = () => {
      if (this.typingTimer) {
        clearTimeout(this.typingTimer);
      }
      notice.hide();
    };
  }

  private hideGenerationIndicator() {
    // Этот метод может быть использован для скрытия индикаторов
    // В данной реализации индикаторы исчезают автоматически
  }

  private showManualTriggerButton(editor: Editor, view: MarkdownView) {
    // Создаем всплывающее уведомление с кнопкой ручного запуска
    const notice = new Notice('', 5000);
    const noticeEl = notice.noticeEl;
    noticeEl.innerHTML = '';
    
    const text = noticeEl.createEl('span', { text: 'Готов сгенерировать заголовок. ' });
    const generateButton = noticeEl.createEl('button', { text: 'Сгенерировать' });
    generateButton.style.marginLeft = '10px';
    generateButton.style.backgroundColor = 'var(--interactive-accent)';
    generateButton.style.color = 'var(--text-on-accent)';
    generateButton.style.border = 'none';
    generateButton.style.padding = '4px 8px';
    generateButton.style.borderRadius = '3px';
    generateButton.style.cursor = 'pointer';
    
    generateButton.onclick = () => {
      notice.hide();
      this.autoGenerateTitle(editor, view);
    };
    
    const cancelButton = noticeEl.createEl('button', { text: 'Отмена' });
    cancelButton.style.marginLeft = '5px';
    cancelButton.onclick = () => {
      notice.hide();
    };
  }

  private async generateTitleForActiveNote() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      showNotice('Откройте заметку для генерации заголовка');
      return;
    }

    const editor = activeView.editor;
    await this.generateTitleForEditor(editor, activeView);
  }

  private async generateTitleForEditor(editor: Editor, view: MarkdownView) {
    if (this.isGenerating) {
      showNotice('Генерация заголовка уже выполняется...');
      return;
    }

    const content = editor.getValue();
    if (!content || content.trim().length < 10) {
      showNotice('Недостаточно содержимого для генерации заголовка');
      return;
    }

    if (!this.settings.apiKey) {
      showNotice('Настройте API ключ OpenAI в настройках плагина');
      return;
    }

    try {
      this.isGenerating = true;
      showNotice('Генерирую заголовок...', 2000);

      const suggestedTitle = await generateTitle(
        content,
        this.settings.apiKey,
        this.settings.model,
        this.settings.temperature,
        this.settings.language
      );

      this.showTitleSuggestionModal(editor, view, suggestedTitle);
    } catch (error) {
      console.error('Ошибка генерации заголовка:', error);
      showNotice(`Ошибка: ${error.message}`);
    } finally {
      this.isGenerating = false;
    }
  }

  private async generateTitleForFile(file: TFile) {
    const content = await this.app.vault.read(file);
    if (!content || content.trim().length < 10) {
      showNotice('Недостаточно содержимого для генерации заголовка');
      return;
    }

    if (!this.settings.apiKey) {
      showNotice('Настройте API ключ OpenAI в настройках плагина');
      return;
    }

    try {
      this.isGenerating = true;
      showNotice('Генерирую заголовок...', 2000);

      const suggestedTitle = await generateTitle(
        content,
        this.settings.apiKey,
        this.settings.model,
        this.settings.temperature,
        this.settings.language
      );

      // Создаем модальное окно для подтверждения
      new TitleSuggestionModal(this.app, suggestedTitle, async (accepted: boolean, editedTitle?: string) => {
        if (accepted) {
          const finalTitle = editedTitle || suggestedTitle;
          // Обновляем содержимое файла
          const updatedContent = this.insertTitleIntoContent(content, finalTitle);
          await this.app.vault.modify(file, updatedContent);
          showNotice(`Заголовок добавлен в файл: "${finalTitle}"`);
        }
      }, null, null, this).open();
    } catch (error) {
      console.error('Ошибка генерации заголовка:', error);
      showNotice(`Ошибка: ${error.message}`);
    } finally {
      this.isGenerating = false;
    }
  }

  private showTitleSuggestionModal(editor: Editor, view: MarkdownView, suggestedTitle: string) {
    new TitleSuggestionModal(this.app, suggestedTitle, (accepted: boolean, editedTitle?: string) => {
      if (accepted) {
        const finalTitle = editedTitle || suggestedTitle;
        this.replaceTitle(editor, finalTitle);
        showNotice(`Заголовок обновлен: "${finalTitle}"`);
        // Увеличиваем счетчик генераций для этой заметки
        const file = view?.file;
        if (file) {
          const currentCount = this.generatedCountForFile.get(file.path) || 0;
          this.generatedCountForFile.set(file.path, currentCount + 1);
        }
        // Переименовываем файл, если это возможно
        if (view.file) {
          this.renameFile(view.file, finalTitle);
        }
      }
    }, editor, view, this).open();
  }

  private replaceTitle(editor: Editor, newTitle: string) {
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
    const lines = content.split('\n');
    // Если первая строка уже содержит нужный заголовок, ничего не делаем
    if (lines[0] && lines[0].trim() === `# ${title}`) {
      return content;
    }
    // Проверяем, есть ли уже заголовок в первой строке
    if (lines[0] && lines[0].trim().startsWith('#')) {
      // Заменяем существующий заголовок
      lines[0] = `# ${title}`;
    } else {
      // Добавляем новый заголовок в начало
      lines.unshift(`# ${title}`, '');
    }
    return lines.join('\n');
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
      showNotice('Генерация заголовка уже выполняется...');
      return;
    }

    const content = editor.getValue();
    if (!content || content.trim().length < 10) {
      showNotice('Недостаточно содержимого для генерации заголовка');
      return;
    }

    if (!this.settings.apiKey) {
      showNotice('Настройте API ключ OpenAI в настройках плагина');
      return;
    }

    try {
      this.isGenerating = true;
      showNotice('Генерирую заголовок...', 2000);

      const suggestedTitle = await generateTitle(
        content,
        this.settings.apiKey,
        this.settings.model,
        this.settings.temperature,
        this.settings.language
      );

      // Применяем заголовок напрямую без подтверждения
      this.replaceTitle(editor, suggestedTitle);
      showNotice(`Заголовок обновлен: "${suggestedTitle}"`);
      
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
      console.error('Ошибка генерации заголовка:', error);
      showNotice(`Ошибка: ${error.message}`);
    } finally {
      this.isGenerating = false;
    }
  }
}

class TitleSuggestionModal extends Modal {
  private suggestedTitle: string;
  private onResult: (accepted: boolean, editedTitle?: string) => void;
  private editor: Editor | null;
  private view: MarkdownView | null;
  private plugin: AutoTitlePlugin;
  private titleInput: HTMLTextAreaElement;

  constructor(app: App, suggestedTitle: string, onResult: (accepted: boolean, editedTitle?: string) => void, editor: Editor | null, view: MarkdownView | null, plugin: AutoTitlePlugin) {
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

    contentEl.createEl('h2', { text: 'Предлагаемый заголовок' });
    
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
    buttonsDiv.style.gap = '10px';
    buttonsDiv.style.justifyContent = 'flex-end';
    buttonsDiv.style.marginTop = '20px';
    buttonsDiv.style.flexWrap = 'wrap';

    const regenerateButton = buttonsDiv.createEl('button', { text: 'Сгенерировать другой' });
    regenerateButton.onclick = () => {
      this.regenerateTitle();
    };

    const acceptButton = buttonsDiv.createEl('button', { text: 'Принять' });
    acceptButton.classList.add('mod-cta');
    acceptButton.onclick = () => {
      this.close();
      this.onResult(true, this.titleInput.value);
    };

    const rejectButton = buttonsDiv.createEl('button', { text: 'Отклонить' });
    rejectButton.onclick = () => {
      this.close();
      this.onResult(false);
    };

    // Фокус на поле ввода
    this.titleInput.focus();
    this.titleInput.select();
  }

  private async regenerateTitle() {
    try {
      if (!this.editor || !this.view || !this.plugin) {
        new Notice('Невозможно перегенерировать заголовок');
        return;
      }
      
      this.titleInput.disabled = true;
      this.titleInput.value = 'Генерирую новый заголовок...';
      
      const content = this.editor.getValue();
      const newTitle = await generateTitle(
        content,
        this.plugin.settings.apiKey,
        this.plugin.settings.model,
        this.plugin.settings.temperature + 0.2, // Увеличиваем температуру для другого стиля
        this.plugin.settings.language
      );
      
      this.suggestedTitle = newTitle;
      this.titleInput.value = newTitle;
      this.titleInput.disabled = false;
      this.titleInput.focus();
      this.titleInput.select();
    } catch (error) {
      console.error('Ошибка повторной генерации заголовка:', error);
      this.titleInput.value = this.suggestedTitle;
      this.titleInput.disabled = false;
      new Notice('Ошибка при повторной генерации заголовка');
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
