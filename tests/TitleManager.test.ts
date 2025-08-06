import { TitleManager } from '../TitleManager';
import { App, TFile, Editor } from 'obsidian';

// Mock Obsidian classes
jest.mock('obsidian', () => ({
  App: jest.fn(),
  TFile: jest.fn(),
  Editor: jest.fn(),
}));

describe('TitleManager', () => {
  let titleManager: TitleManager;
  let mockApp: jest.Mocked<App>;
  let mockFile: jest.Mocked<TFile>;
  let mockEditor: jest.Mocked<Editor>;

  beforeEach(() => {
    mockApp = {
      vault: {
        getAbstractFileByPath: jest.fn(),
      },
      fileManager: {
        renameFile: jest.fn(),
      },
    } as any;

    mockFile = {
      basename: 'Test Note',
      path: 'Test Note.md',
      name: 'Test Note.md',
    } as any;

    mockEditor = {
      getValue: jest.fn(),
      setValue: jest.fn(),
    } as any;

    titleManager = new TitleManager(mockApp);
  });

  describe('removeDuplicateTitle', () => {
    it('should remove duplicate title from content', () => {
      const content = '# Test Title\n\nSome content';
      const title = 'Test Title';
      const result = titleManager.removeDuplicateTitle(content, title);
      expect(result).toBe('Some content');
    });

    it('should not modify content without duplicate title', () => {
      const content = '# Different Title\n\nSome content';
      const title = 'Test Title';
      const result = titleManager.removeDuplicateTitle(content, title);
      expect(result).toBe(content);
    });
  });

  describe('hasDuplicateTitle', () => {
    it('should detect duplicate title', () => {
      const content = '# Test Title\n\nContent';
      const title = 'Test Title';
      const result = titleManager.hasDuplicateTitle(content, title);
      expect(result).toBe(true);
    });

    it('should return false for no duplicate', () => {
      const content = '# Different Title\n\nContent';
      const title = 'Test Title';
      const result = titleManager.hasDuplicateTitle(content, title);
      expect(result).toBe(false);
    });
  });

  describe('checkDuplication', () => {
    it('should return correct duplication check result', () => {
      const content = '# Test Note\n\nSome content';
      const result = titleManager.checkDuplication(content, mockFile);
      
      expect(result.hasDuplication).toBe(true);
      expect(result.contentTitle).toBe('Test Note');
      expect(result.noteTitle).toBe('Test Note');
      expect(result.shouldRemove).toBe(true);
    });

    it('should return false for no duplication', () => {
      const content = '# Different Title\n\nSome content';
      const result = titleManager.checkDuplication(content, mockFile);
      
      expect(result.hasDuplication).toBe(false);
      expect(result.contentTitle).toBe('Different Title');
      expect(result.noteTitle).toBe('Test Note');
      expect(result.shouldRemove).toBe(false);
    });
  });

  describe('applyTitleWithoutDuplication', () => {
    it('should apply title and remove duplicate from content', async () => {
      const content = '# Old Title\n\nSome content';
      const newTitle = 'New Title';
      
      mockEditor.getValue.mockReturnValue(content);
      mockApp.vault.getAbstractFileByPath.mockReturnValue(null);
      
      const result = await titleManager.applyTitleWithoutDuplication(mockEditor, mockFile, newTitle);
      
      expect(result.success).toBe(true);
      expect(result.duplicateRemoved).toBe(true);
      expect(mockEditor.setValue).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const content = '# Test Title\n\nContent';
      const newTitle = 'New Title';
      
      mockEditor.getValue.mockReturnValue(content);
      mockApp.fileManager.renameFile.mockRejectedValue(new Error('Rename failed'));
      
      const result = await titleManager.applyTitleWithoutDuplication(mockEditor, mockFile, newTitle);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Не удалось установить заголовок');
    });
  });
});