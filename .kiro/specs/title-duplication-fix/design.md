# Design Document

## Overview

Данный дизайн решает проблему дублирования заголовков в Obsidian плагине автоматической генерации заголовков. В настоящее время плагин добавляет заголовок в содержимое заметки (как H1 markdown), что приводит к тому, что Obsidian автоматически использует этот заголовок как заголовок заметки, создавая визуальное дублирование.

Решение заключается в разделении логики установки заголовка заметки (через API Obsidian) и управления содержимым заметки, а также в добавлении функциональности для очистки существующих дублированных заголовков.

## Architecture

### Current Architecture Issues
- Функция `replaceTitle()` добавляет H1 заголовок в начало содержимого
- Функция `insertTitleIntoContent()` также добавляет H1 заголовок в содержимое
- Obsidian автоматически использует первую строку с `#` как заголовок заметки
- Результат: заголовок отображается дважды - в заголовке заметки и в содержимом

### New Architecture
1. **Title Setting Service**: Отдельный сервис для установки заголовка заметки через Obsidian API
2. **Content Processing Service**: Сервис для обработки содержимого заметки и удаления дублированных заголовков
3. **Duplication Detection**: Логика для обнаружения дублированных заголовков
4. **Migration Service**: Сервис для исправления существующих заметок с дублированными заголовками

## Components and Interfaces

### 1. TitleManager Class
```typescript
class TitleManager {
  // Устанавливает заголовок заметки через Obsidian API
  async setNoteTitle(file: TFile, title: string): Promise<void>
  
  // Удаляет дублированный заголовок из содержимого
  removeDuplicateTitle(content: string, title: string): string
  
  // Проверяет, есть ли дублированный заголовок
  hasDuplicateTitle(content: string, title: string): boolean
  
  // Применяет заголовок без дублирования
  applyTitleWithoutDuplication(editor: Editor, file: TFile, title: string): Promise<void>
}
```

### 2. ContentProcessor Class
```typescript
class ContentProcessor {
  // Очищает содержимое от дублированных заголовков
  cleanDuplicatedTitles(content: string, noteTitle: string): string
  
  // Извлекает первый H1 заголовок из содержимого
  extractFirstH1Title(content: string): string | null
  
  // Проверяет, является ли первая строка H1 заголовком
  isFirstLineH1Title(content: string): boolean
}
```

### 3. MigrationService Class
```typescript
class MigrationService {
  // Исправляет все заметки с дублированными заголовками
  async fixAllDuplicatedTitles(): Promise<number>
  
  // Исправляет конкретную заметку
  async fixNoteTitle(file: TFile): Promise<boolean>
  
  // Сканирует заметки на наличие дублированных заголовков
  async scanForDuplicatedTitles(): Promise<TFile[]>
}
```

## Data Models

### TitleProcessingResult
```typescript
interface TitleProcessingResult {
  success: boolean;
  originalContent: string;
  processedContent: string;
  titleSet: boolean;
  duplicateRemoved: boolean;
  error?: string;
}
```

### DuplicationCheckResult
```typescript
interface DuplicationCheckResult {
  hasDuplication: boolean;
  contentTitle: string | null;
  noteTitle: string | null;
  shouldRemove: boolean;
}
```

## Error Handling

### Error Types
1. **API Errors**: Ошибки при работе с Obsidian API
2. **Content Processing Errors**: Ошибки при обработке содержимого заметки
3. **File Access Errors**: Ошибки доступа к файлам заметок

### Error Handling Strategy
- Все операции с файлами обернуты в try-catch блоки
- Логирование ошибок в консоль для отладки
- Пользовательские уведомления только для критических ошибок
- Graceful degradation: если не удается установить заголовок через API, используется fallback к содержимому

### Recovery Mechanisms
- Backup содержимого перед изменениями
- Rollback при критических ошибках
- Retry логика для API вызовов

## Testing Strategy

### Unit Tests
1. **TitleManager Tests**
   - Тестирование установки заголовка через API
   - Тестирование удаления дублированных заголовков
   - Тестирование обнаружения дублирования

2. **ContentProcessor Tests**
   - Тестирование очистки содержимого от заголовков
   - Тестирование извлечения H1 заголовков
   - Тестирование различных форматов заголовков

3. **MigrationService Tests**
   - Тестирование массового исправления заметок
   - Тестирование сканирования дублированных заголовков

### Integration Tests
1. **End-to-End Title Generation**
   - Генерация заголовка без дублирования
   - Проверка корректной установки заголовка заметки
   - Проверка отсутствия заголовка в содержимом

2. **Migration Tests**
   - Исправление существующих заметок
   - Проверка сохранности остального содержимого

### Manual Testing Scenarios
1. Создание новой заметки с автогенерацией заголовка
2. Обновление существующей заметки с заголовком
3. Исправление заметки с дублированным заголовком
4. Проверка работы с различными форматами заголовков (H1, H2, etc.)

## Implementation Details

### Obsidian API Integration
- Использование `app.fileManager.processFrontMatter()` для установки заголовка
- Использование `app.vault.modify()` для обновления содержимого
- Использование `app.metadataCache` для получения метаданных заметки

### Content Processing Logic
1. **Title Detection**: Регулярные выражения для обнаружения H1 заголовков
2. **Content Cleaning**: Удаление только первого H1 заголовка, если он совпадает с заголовком заметки
3. **Preservation**: Сохранение всех остальных заголовков и форматирования

### Migration Strategy
1. **Batch Processing**: Обработка заметок небольшими батчами для производительности
2. **Progress Tracking**: Отслеживание прогресса миграции
3. **User Consent**: Запрос подтверждения перед массовыми изменениями

### Performance Considerations
- Lazy loading для больших коллекций заметок
- Debouncing для автоматических операций
- Кэширование результатов сканирования дублированных заголовков