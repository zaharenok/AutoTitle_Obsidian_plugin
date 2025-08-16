/**
 * ContentProcessor - utility class for processing note content
 * and detecting duplicated titles
 */
export class ContentProcessor {
  
  /**
   * Cleans content from duplicated titles
   * @param content - note content
   * @param noteTitle - note title
   * @returns cleaned content
   */
  cleanDuplicatedTitles(content: string, noteTitle: string): string {
    if (!content || !noteTitle) {
      return content;
    }

    const lines = content.split('\n');
    const firstLine = lines[0]?.trim();
    
    // Check if the first line is an H1 title that matches the note title
    if (this.isH1Title(firstLine) && this.extractTitleText(firstLine) === noteTitle) {
      // Remove the first line and the following empty line if it exists
      lines.shift();
      if (lines[0] && lines[0].trim() === '') {
        lines.shift();
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Extracts the first H1 title from the content
   * @param content - note content
   * @returns title text or null if not found
   */
  extractFirstH1Title(content: string): string | null {
    if (!content) {
      return null;
    }

    const lines = content.split('\n');
    const firstLine = lines[0]?.trim();
    
    if (this.isH1Title(firstLine)) {
      return this.extractTitleText(firstLine);
    }
    
    return null;
  }

  /**
   * Checks if the first line is an H1 title
   * @param content - note content
   * @returns true if the first line is an H1 title
   */
  isFirstLineH1Title(content: string): boolean {
    if (!content) {
      return false;
    }

    const firstLine = content.split('\n')[0]?.trim();
    return this.isH1Title(firstLine);
  }

  /**
   * Checks if there is a duplicate title in the content
   * @param content - note content
   * @param noteTitle - note title
   * @returns true if there is a duplicate
   */
  hasDuplicateTitle(content: string, noteTitle: string): boolean {
    if (!content || !noteTitle) {
      return false;
    }

    const firstH1 = this.extractFirstH1Title(content);
    return firstH1 === noteTitle;
  }

  /**
   * Checks if a line is an H1 title
   * @param line - line to check
   * @returns true if the line is an H1 title
   */
  private isH1Title(line: string): boolean {
    if (!line) {
      return false;
    }
    
    return /^#\s+.+/.test(line.trim());
  }

  /**
   * Extracts the title text from a markdown line
   * @param line - line containing the title
   * @returns title text without markdown formatting
   */
  private extractTitleText(line: string): string {
    if (!line) {
      return '';
    }
    
    return line.replace(/^#+\s*/, '').trim();
  }

  /**
   * Validates and truncates a title to a maximum length
   * @param title - original title
   * @param maxLength - maximum length (default 100)
   * @returns truncated title
   */
  validateAndTruncateTitle(title: string, maxLength: number = 100): string {
    if (!title) {
      return '';
    }

    const cleanTitle = title.trim();
    
    if (cleanTitle.length <= maxLength) {
      return cleanTitle;
    }

    // Truncate by words to avoid breaking words in the middle
    const words = cleanTitle.split(' ');
    let truncated = '';
    
    for (const word of words) {
      const testLength = truncated ? truncated.length + 1 + word.length : word.length;
      if (testLength <= maxLength - 3) { // -3 для "..."
        truncated = truncated ? `${truncated} ${word}` : word;
      } else {
        break;
      }
    }
    
    return truncated ? `${truncated}...` : cleanTitle.substring(0, maxLength - 3) + '...';
  }
}