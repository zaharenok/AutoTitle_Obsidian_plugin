/**
 * ContentProcessor - утилитарный класс для обработки содержимого заметок
 * и обнаружения дублированных заголовков
 */
export class ContentProcessor {
  
  /**
   * Очищает содержимое от дублированных заголовков
   * @param content - содержимое заметки
   * @param noteTitle - заголовок заметки
   * @returns очищенное содержимое
   */
  cleanDuplicatedTitles(content: string, noteTitle: string): string {
    if (!content || !noteTitle) {
      return content;
    }

    const lines = content.split('\n');
    const firstLine = lines[0]?.trim();
    
    // Проверяем, является ли первая строка H1 заголовком, совпадающим с заголовком заметки
    if (this.isH1Title(firstLine) && this.extractTitleText(firstLine) === noteTitle) {
      // Удаляем первую строку и следующую пустую строку, если она есть
      lines.shift();
      if (lines[0] && lines[0].trim() === '') {
        lines.shift();
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Извлекает первый H1 заголовок из содержимого
   * @param content - содержимое заметки
   * @returns текст заголовка или null, если не найден
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
   * Проверяет, является ли первая строка H1 заголовком
   * @param content - содержимое заметки
   * @returns true, если первая строка - H1 заголовок
   */
  isFirstLineH1Title(content: string): boolean {
    if (!content) {
      return false;
    }

    const firstLine = content.split('\n')[0]?.trim();
    return this.isH1Title(firstLine);
  }

  /**
   * Проверяет, есть ли дублированный заголовок в содержимом
   * @param content - содержимое заметки
   * @param noteTitle - заголовок заметки
   * @returns true, если есть дублирование
   */
  hasDuplicateTitle(content: string, noteTitle: string): boolean {
    if (!content || !noteTitle) {
      return false;
    }

    const firstH1 = this.extractFirstH1Title(content);
    return firstH1 === noteTitle;
  }

  /**
   * Проверяет, является ли строка H1 заголовком
   * @param line - строка для проверки
   * @returns true, если строка является H1 заголовком
   */
  private isH1Title(line: string): boolean {
    if (!line) {
      return false;
    }
    
    return /^#\s+.+/.test(line.trim());
  }

  /**
   * Извлекает текст заголовка из markdown строки
   * @param line - строка с заголовком
   * @returns текст заголовка без markdown разметки
   */
  private extractTitleText(line: string): string {
    if (!line) {
      return '';
    }
    
    return line.replace(/^#+\s*/, '').trim();
  }

  /**
   * Валидирует и обрезает заголовок до максимальной длины
   * @param title - исходный заголовок
   * @param maxLength - максимальная длина (по умолчанию 100)
   * @returns обрезанный заголовок
   */
  validateAndTruncateTitle(title: string, maxLength: number = 100): string {
    if (!title) {
      return '';
    }

    const cleanTitle = title.trim();
    
    if (cleanTitle.length <= maxLength) {
      return cleanTitle;
    }

    // Обрезаем по словам, чтобы не разрывать слова посередине
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