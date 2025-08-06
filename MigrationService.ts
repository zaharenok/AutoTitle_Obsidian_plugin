import { App, TFile, Notice } from 'obsidian';
import { TitleManager } from './TitleManager';

/**
 * Результат миграции
 */
export interface MigrationResult {
  totalFiles: number;
  processedFiles: number;
  fixedFiles: number;
  errors: string[];
}

/**
 * MigrationService - сервис для массового исправления заметок с дублированными заголовками
 */
export class MigrationService {
  private app: App;
  private titleManager: TitleManager;

  constructor(app: App, titleManager: TitleManager) {
    this.app = app;
    this.titleManager = titleManager;
  }

  /**
   * Исправляет все заметки с дублированными заголовками
   * @param showProgress - показывать ли прогресс пользователю
   * @returns Promise<MigrationResult>
   */
  async fixAllDuplicatedTitles(showProgress: boolean = true): Promise<MigrationResult> {
    const result: MigrationResult = {
      totalFiles: 0,
      processedFiles: 0,
      fixedFiles: 0,
      errors: [],
    };

    try {
      // Получаем все markdown файлы
      const markdownFiles = this.app.vault.getMarkdownFiles();
      result.totalFiles = markdownFiles.length;

      if (showProgress) {
        new Notice(`Начинаем проверку ${result.totalFiles} заметок...`);
      }

      // Обрабатываем файлы батчами для лучшей производительности
      const batchSize = 10;
      for (let i = 0; i < markdownFiles.length; i += batchSize) {
        const batch = markdownFiles.slice(i, i + batchSize);
        
        for (const file of batch) {
          try {
            const wasFixed = await this.fixNoteTitle(file);
            result.processedFiles++;
            
            if (wasFixed) {
              result.fixedFiles++;
            }
          } catch (error) {
            result.errors.push(`${file.path}: ${error.message}`);
          }
        }

        // Показываем прогресс каждые 50 файлов
        if (showProgress && (i + batchSize) % 50 === 0) {
          new Notice(`Обработано ${result.processedFiles} из ${result.totalFiles} заметок...`);
        }

        // Небольшая пауза между батчами, чтобы не блокировать UI
        await this.sleep(10);
      }

      if (showProgress) {
        new Notice(`Миграция завершена! Исправлено ${result.fixedFiles} заметок из ${result.processedFiles} обработанных.`);
      }

    } catch (error) {
      result.errors.push(`Общая ошибка миграции: ${error.message}`);
    }

    return result;
  }

  /**
   * Исправляет конкретную заметку
   * @param file - файл заметки
   * @returns Promise<boolean> - true, если заметка была исправлена
   */
  async fixNoteTitle(file: TFile): Promise<boolean> {
    try {
      return await this.titleManager.detectAndCleanupDuplicates(file);
    } catch (error) {
      console.error(`Ошибка исправления заметки ${file.path}:`, error);
      throw new Error(`Не удалось исправить заметку: ${error.message}`);
    }
  }

  /**
   * Сканирует заметки на наличие дублированных заголовков
   * @returns Promise<TFile[]> - список файлов с дублированными заголовками
   */
  async scanForDuplicatedTitles(): Promise<TFile[]> {
    const duplicatedFiles: TFile[] = [];
    const markdownFiles = this.app.vault.getMarkdownFiles();

    for (const file of markdownFiles) {
      try {
        const content = await this.app.vault.read(file);
        const duplicationCheck = this.titleManager.checkDuplication(content, file);
        
        if (duplicationCheck.hasDuplication) {
          duplicatedFiles.push(file);
        }
      } catch (error) {
        console.error(`Ошибка сканирования файла ${file.path}:`, error);
      }
    }

    return duplicatedFiles;
  }

  /**
   * Получает статистику по дублированным заголовкам
   * @returns Promise<{total: number, duplicated: number, percentage: number}>
   */
  async getDuplicationStatistics(): Promise<{total: number, duplicated: number, percentage: number}> {
    const markdownFiles = this.app.vault.getMarkdownFiles();
    const duplicatedFiles = await this.scanForDuplicatedTitles();
    
    const total = markdownFiles.length;
    const duplicated = duplicatedFiles.length;
    const percentage = total > 0 ? Math.round((duplicated / total) * 100) : 0;

    return { total, duplicated, percentage };
  }

  /**
   * Проверяет, нужна ли миграция
   * @returns Promise<boolean>
   */
  async needsMigration(): Promise<boolean> {
    const stats = await this.getDuplicationStatistics();
    return stats.duplicated > 0;
  }

  /**
   * Создает резервную копию заметки перед изменением
   * @param file - файл заметки
   * @returns Promise<void>
   */
  private async createBackup(file: TFile): Promise<void> {
    try {
      const content = await this.app.vault.read(file);
      const backupPath = `${file.path}.backup-${Date.now()}`;
      await this.app.vault.create(backupPath, content);
    } catch (error) {
      console.error(`Не удалось создать резервную копию для ${file.path}:`, error);
    }
  }

  /**
   * Пауза для предотвращения блокировки UI
   * @param ms - миллисекунды
   * @returns Promise<void>
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}