import { App, TFile, Notice } from 'obsidian';
import { TitleManager } from './TitleManager';

/**
 * Migration result
 */
export interface MigrationResult {
  totalFiles: number;
  processedFiles: number;
  fixedFiles: number;
  errors: string[];
}

/**
 * MigrationService - service for bulk fixing notes with duplicate titles
 */
export class MigrationService {
  private app: App;
  private titleManager: TitleManager;

  constructor(app: App, titleManager: TitleManager) {
    this.app = app;
    this.titleManager = titleManager;
  }

  /**
   * Fixes all notes with duplicate titles
   * @param showProgress - whether to show progress to the user
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
      // Get all markdown files
      const markdownFiles = this.app.vault.getMarkdownFiles();
      result.totalFiles = markdownFiles.length;

      if (showProgress) {
        new Notice(`Starting check of ${result.totalFiles} notes...`);
      }

      // Process files in batches for better performance
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
            result.errors.push(`Migration error: ${error.message}`);
          }
        }

        // Show progress every 50 files
        if (showProgress && (i + batchSize) % 50 === 0) {
          new Notice(`Processed ${result.processedFiles} out of ${result.totalFiles} notes...`);
        }

        // Small pause between batches to avoid blocking the UI
        await this.sleep(10);
      }

      if (showProgress) {
        new Notice(`Migration completed! Fixed ${result.fixedFiles} out of ${result.processedFiles} processed notes.`);
      }

    } catch (error) {
      result.errors.push(`General migration error: ${error.message}`);
    }

    return result;
  }

  /**
   * Fixes a specific note
   * @param file - note file
   * @returns Promise<boolean> - true if the note was fixed
   */
  async fixNoteTitle(file: TFile): Promise<boolean> {
    try {
      return await this.titleManager.detectAndCleanupDuplicates(file);
    } catch (error) {
      console.error(`Error scanning file ${file.path}:`, error);
      throw new Error(`Failed to fix note: ${error.message}`);
    }
  }

  /**
   * Scans notes for duplicated titles
   * @returns Promise<TFile[]> - list of files with duplicated titles
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
        console.error(`Error scanning file ${file.path}:`, error);
      }
    }

    return duplicatedFiles;
  }

  /**
   * Gets statistics on duplicated titles
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
   * Checks if migration is needed
   * @returns Promise<boolean>
   */
  async needsMigration(): Promise<boolean> {
    const stats = await this.getDuplicationStatistics();
    return stats.duplicated > 0;
  }

  /**
   * Creates a backup of a note before making changes
   * @param file - note file
   * @returns Promise<void>
   */
  private async createBackup(file: TFile): Promise<void> {
    try {
      const content = await this.app.vault.read(file);
      const backupPath = `${file.path}.backup-${Date.now()}`;
      await this.app.vault.create(backupPath, content);
    } catch (error) {
      console.error(`Failed to create backup for ${file.path}:`, error);
    }
  }

  /**
   * Pause to prevent UI blocking
   * @param ms - milliseconds to pause
   * @returns Promise<void>
   */
  private sleep(ms: number): Promise<void> {
    return new Promise<void>(resolve => {
      setTimeout(resolve, ms);
    });
  }
}