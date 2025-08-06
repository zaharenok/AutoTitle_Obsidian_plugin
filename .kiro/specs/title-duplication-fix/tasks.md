# Implementation Plan

- [ ] 1. Create ContentProcessor utility class
  - Implement utility class for processing note content and detecting duplicate titles
  - Add methods for extracting H1 titles and checking for duplications
  - Write unit tests for content processing logic
  - _Requirements: 1.3, 4.1, 4.3_

- [ ] 2. Create TitleManager service class
  - Implement service class for managing note titles through Obsidian API
  - Add method to set note title using Obsidian's file manager API
  - Add method to remove duplicate titles from content
  - Write unit tests for title management operations
  - _Requirements: 1.1, 1.2, 3.2_

- [ ] 3. Update replaceTitle method to prevent duplication
  - Modify existing replaceTitle method to use TitleManager service
  - Remove logic that adds H1 title to content
  - Implement title setting through Obsidian API instead of content modification
  - Add fallback mechanism for cases where API fails
  - _Requirements: 1.1, 1.2, 3.1_

- [ ] 4. Update insertTitleIntoContent method to prevent duplication
  - Modify insertTitleIntoContent method to avoid adding H1 titles to content
  - Update method to only set note title through metadata
  - Ensure method works correctly for file-based title generation
  - _Requirements: 1.1, 1.2, 3.1_

- [ ] 5. Add duplicate title detection and cleanup
  - Implement detection logic for existing notes with duplicate titles
  - Add cleanup method to remove duplicate H1 titles from content
  - Ensure cleanup preserves other H1 titles that don't match note title
  - Write tests for duplicate detection and cleanup logic
  - _Requirements: 2.1, 2.2, 4.1, 4.2_

- [ ] 6. Create MigrationService for fixing existing notes
  - Implement service class for batch processing of existing notes
  - Add method to scan all notes for duplicate titles
  - Add method to fix individual notes with duplicate titles
  - Add progress tracking and user feedback for migration process
  - Write tests for migration service functionality
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 7. Add migration command to plugin
  - Create new command for fixing duplicate titles in existing notes
  - Add command to plugin's command palette
  - Implement user confirmation dialog before running migration
  - Add progress notification during migration process
  - _Requirements: 2.1, 2.2_

- [ ] 8. Update auto-generation logic to prevent duplication
  - Modify autoGenerateTitle method to use new TitleManager
  - Update generateTitleDirect method to prevent content duplication
  - Ensure all automatic title generation uses API-based approach
  - Test auto-generation with various content types
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [ ] 9. Update modal-based title generation
  - Modify TitleSuggestionModal to use new title management approach
  - Update modal's accept logic to prevent content duplication
  - Ensure modal works correctly with both new and existing notes
  - Test modal functionality with various scenarios
  - _Requirements: 1.1, 1.2, 3.1_

- [ ] 10. Add comprehensive error handling
  - Implement error handling for all new title management operations
  - Add fallback mechanisms when API operations fail
  - Ensure graceful degradation maintains plugin functionality
  - Add appropriate user notifications for error cases
  - Write tests for error scenarios
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 11. Update existing tests and add integration tests
  - Update existing plugin tests to work with new title management
  - Add integration tests for end-to-end title generation without duplication
  - Add tests for migration functionality
  - Test plugin behavior with various note formats and structures
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [ ] 12. Add settings for duplication handling
  - Add plugin setting to control duplicate title cleanup behavior
  - Add setting to enable/disable automatic migration of existing notes
  - Update settings UI to include new duplication-related options
  - Ensure settings are properly saved and loaded
  - _Requirements: 2.1, 3.1_