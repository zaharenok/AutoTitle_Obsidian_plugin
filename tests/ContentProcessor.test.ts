import { ContentProcessor } from '../ContentProcessor';

describe('ContentProcessor', () => {
  let processor: ContentProcessor;

  beforeEach(() => {
    processor = new ContentProcessor();
  });

  describe('extractFirstH1Title', () => {
    it('should extract H1 title from content', () => {
      const content = '# Test Title\n\nSome content here';
      const result = processor.extractFirstH1Title(content);
      expect(result).toBe('Test Title');
    });

    it('should return null if no H1 title found', () => {
      const content = 'Some content without title';
      const result = processor.extractFirstH1Title(content);
      expect(result).toBeNull();
    });

    it('should return null for empty content', () => {
      const result = processor.extractFirstH1Title('');
      expect(result).toBeNull();
    });
  });

  describe('isFirstLineH1Title', () => {
    it('should return true for H1 title', () => {
      const content = '# Test Title\n\nContent';
      const result = processor.isFirstLineH1Title(content);
      expect(result).toBe(true);
    });

    it('should return false for non-H1 first line', () => {
      const content = 'Regular text\n\nContent';
      const result = processor.isFirstLineH1Title(content);
      expect(result).toBe(false);
    });

    it('should return false for H2 title', () => {
      const content = '## Test Title\n\nContent';
      const result = processor.isFirstLineH1Title(content);
      expect(result).toBe(false);
    });
  });

  describe('hasDuplicateTitle', () => {
    it('should detect duplicate title', () => {
      const content = '# Test Title\n\nSome content';
      const noteTitle = 'Test Title';
      const result = processor.hasDuplicateTitle(content, noteTitle);
      expect(result).toBe(true);
    });

    it('should return false for different titles', () => {
      const content = '# Different Title\n\nSome content';
      const noteTitle = 'Test Title';
      const result = processor.hasDuplicateTitle(content, noteTitle);
      expect(result).toBe(false);
    });

    it('should return false for no H1 title', () => {
      const content = 'Some content without title';
      const noteTitle = 'Test Title';
      const result = processor.hasDuplicateTitle(content, noteTitle);
      expect(result).toBe(false);
    });
  });

  describe('cleanDuplicatedTitles', () => {
    it('should remove duplicate H1 title', () => {
      const content = '# Test Title\n\nSome content here';
      const noteTitle = 'Test Title';
      const result = processor.cleanDuplicatedTitles(content, noteTitle);
      expect(result).toBe('Some content here');
    });

    it('should remove duplicate H1 title with empty line', () => {
      const content = '# Test Title\n\nSome content here';
      const noteTitle = 'Test Title';
      const result = processor.cleanDuplicatedTitles(content, noteTitle);
      expect(result).toBe('Some content here');
    });

    it('should not remove different H1 title', () => {
      const content = '# Different Title\n\nSome content here';
      const noteTitle = 'Test Title';
      const result = processor.cleanDuplicatedTitles(content, noteTitle);
      expect(result).toBe(content);
    });

    it('should handle empty content', () => {
      const result = processor.cleanDuplicatedTitles('', 'Test Title');
      expect(result).toBe('');
    });
  });

  describe('validateAndTruncateTitle', () => {
    it('should return title as-is if within limit', () => {
      const title = 'Short Title';
      const result = processor.validateAndTruncateTitle(title, 100);
      expect(result).toBe('Short Title');
    });

    it('should truncate long title', () => {
      const title = 'This is a very long title that exceeds the maximum length limit and should be truncated';
      const result = processor.validateAndTruncateTitle(title, 50);
      expect(result.length).toBeLessThanOrEqual(50);
      expect(result).toContain('...');
    });

    it('should truncate by words', () => {
      const title = 'This is a test title';
      const result = processor.validateAndTruncateTitle(title, 15);
      expect(result).toBe('This is a...');
    });

    it('should handle empty title', () => {
      const result = processor.validateAndTruncateTitle('', 100);
      expect(result).toBe('');
    });
  });
});