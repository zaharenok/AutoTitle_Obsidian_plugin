import { App, TFile, Editor } from 'obsidian';
import { ContentProcessor } from './ContentProcessor';
import { AutoTitleSettings } from './settings';

/**
 * Результат обработки заголовка
 */
export interface TitleProcessingResult {
  success: boolean;
  originalContent: string;
  processedContent: string;
  titleSet: boolean;
  duplicateRemoved: boolean;
  error?: string;
}

/**
 * Результат проверки дублирования
 */
export interface DuplicationCheckResult {
  hasDuplication: boolean;
  contentTitle: string | null;
  noteTitle: string | null;
  shouldRemove: boolean;
}

/**
 * TitleManager - сервис для управления заголовками заметок через Obsidian API
 */
export class TitleManager {
  private app: App;
  private contentProcessor: ContentProcessor;
  private settings: AutoTitleSettings | null = null;

  constructor(app: App) {
    this.app = app;
    this.contentProcessor = new ContentProcessor();
  }

  /**
   * Устанавливает настройки плагина
   * @param settings - настройки плагина
   */
  setSettings(settings: AutoTitleSettings) {
    this.settings = settings;
  }

  /**
   * Устанавливает заголовок заметки через Obsidian API
   * @param file - файл заметки
   * @param title - новый заголовок
   * @returns Promise<void>
   */
  async setNoteTitle(file: TFile, title: string): Promise<void> {
    try {
      // Валидируем и обрезаем заголовок
      const maxLength = this.settings?.maxTitleLength || 100;
      const validatedTitle = this.contentProcessor.validateAndTruncateTitle(title, maxLength);
      
      // Используем fileManager для переименования файла, что автоматически обновит заголовок
      const sanitizedTitle = this.sanitizeFilename(validatedTitle);
      
      if (sanitizedTitle && sanitizedTitle !== file.basename) {
        const newPath = file.path.replace(file.name, `${sanitizedTitle}.md`);
        
        // Проверяем, не существует ли уже файл с таким именем
        const existingFile = this.app.vault.getAbstractFileByPath(newPath);
        if (!existingFile) {
          await this.app.fileManager.renameFile(file, newPath);
        }
      }
    } catch (error) {
      console.error('Ошибка установки заголовка заметки:', error);
      throw new Error(`Не удалось установить заголовок: ${error.message}`);
    }
  }

  /**
   * Удаляет дублированный заголовок из содержимого
   * @param content - содержимое заметки
   * @param title - заголовок заметки
   * @returns очищенное содержимое
   */
  removeDuplicateTitle(content: string, title: string): string {
    return this.contentProcessor.cleanDuplicatedTitles(content, title);
  }

  /**
   * Проверяет, есть ли дублированный заголовок
   * @param content - содержимое заметки
   * @param title - заголовок заметки
   * @returns true, если есть дублирование
   */
  hasDuplicateTitle(content: string, title: string): boolean {
    return this.contentProcessor.hasDuplicateTitle(content, title);
  }

  /**
   * Применяет заголовок без дублирования
   * @param editor - редактор Obsidian
   * @param file - файл заметки
   * @param title - новый заголовок
   * @returns Promise<TitleProcessingResult>
   */
  async applyTitleWithoutDuplication(editor: Editor, file: TFile, title: string): Promise<TitleProcessingResult> {
    const originalContent = editor.getValue();
    
    try {
      // Валидируем и обрезаем заголовок
      const maxLength = this.settings?.maxTitleLength || 100;
      const validatedTitle = this.contentProcessor.validateAndTruncateTitle(title, maxLength);
      
      // Устанавливаем заголовок файла
      await this.setNoteTitle(file, validatedTitle);
      
      // Удаляем дублированный заголовок из содержимого
      const processedContent = this.removeDuplicateTitle(originalContent, validatedTitle);
      
      // Обновляем содержимое в редакторе, только если оно изменилось
      const duplicateRemoved = processedContent !== originalContent;
      if (duplicateRemoved) {
        editor.setValue(processedContent);
      }
      
      return {
        success: true,
        originalContent,
        processedContent,
        titleSet: true,
        duplicateRemoved,
      };
    } catch (error) {
      console.error('Ошибка применения заголовка:', error);
      return {
        success: false,
        originalContent,
        processedContent: originalContent,
        titleSet: false,
        duplicateRemoved: false,
        error: error.message,
      };
    }
  }

  /**
   * Проверяет дублирование заголовков
   * @param content - содержимое заметки
   * @param file - файл заметки
   * @returns результат проверки дублирования
   */
  checkDuplication(content: string, file: TFile): DuplicationCheckResult {
    const contentTitle = this.contentProcessor.extractFirstH1Title(content);
    const noteTitle = file.basename;
    
    const hasDuplication = contentTitle === noteTitle;
    const shouldRemove = hasDuplication && contentTitle !== null;
    
    return {
      hasDuplication,
      contentTitle,
      noteTitle,
      shouldRemove,
    };
  }

  /**
   * Обнаруживает и очищает дублированные заголовки в заметке
   * @param file - файл заметки
   * @returns Promise<boolean> - true, если были внесены изменения
   */
  async detectAndCleanupDuplicates(file: TFile): Promise<boolean> {
    try {
      const content = await this.app.vault.read(file);
      const duplicationCheck = this.checkDuplication(content, file);
      
      if (duplicationCheck.shouldRemove) {
        const cleanedContent = this.removeDuplicateTitle(content, file.basename);
        await this.app.vault.modify(file, cleanedContent);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Ошибка при очистке дублированных заголовков:', error);
      return false;
    }
  }

  /**
   * Проверяет, нужна ли очистка дублированных заголовков
   * @param content - содержимое заметки
   * @param title - заголовок заметки
   * @returns true, если нужна очистка
   */
  needsCleanup(content: string, title: string): boolean {
    return this.hasDuplicateTitle(content, title);
  }

  /**
   * Очищает имя файла от недопустимых символов
   * @param title - исходный заголовок
   * @returns очищенное имя файла
   */
  private sanitizeFilename(title: string): string {
    return title
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100); // Ограничиваем длину имени файла
  }
}