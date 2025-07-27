# Requirements Document

## Introduction

This feature adds control over the number of times a title can be generated for a single note. Currently, the plugin generates titles only once per note session, but users need more flexibility to control how many times they can generate titles for the same note. This will include a new setting in the plugin configuration menu that allows users to specify the maximum number of title generations per note, with a default value of 1.

## Requirements

### Requirement 1

**User Story:** As a user, I want to configure how many times I can generate a title for a single note, so that I have control over the title generation frequency and can regenerate titles when needed.

#### Acceptance Criteria

1. WHEN the user opens the plugin settings THEN the system SHALL display a new setting called "How many times do you want to generate title for 1 note"
2. WHEN the user views this setting THEN the system SHALL show a default value of 1
3. WHEN the user changes this setting value THEN the system SHALL save the new value to the plugin configuration
4. WHEN the user sets the value to 0 THEN the system SHALL allow unlimited title generations for each note
5. WHEN the user sets a positive integer value THEN the system SHALL limit title generations to that exact number per note

### Requirement 2

**User Story:** As a user, I want the plugin to track and enforce the generation limit per note, so that I cannot exceed my configured limit unless I change the setting.

#### Acceptance Criteria

1. WHEN a note is opened for the first time THEN the system SHALL initialize the generation counter for that note to 0
2. WHEN a title is successfully generated for a note THEN the system SHALL increment the generation counter for that note by 1
3. WHEN the generation counter reaches the configured limit THEN the system SHALL prevent further automatic title generations for that note
4. WHEN the generation counter reaches the configured limit THEN the system SHALL prevent manual title generations for that note
5. WHEN the user attempts to generate a title beyond the limit THEN the system SHALL display a notice explaining the limit has been reached

### Requirement 3

**User Story:** As a user, I want the generation counter to reset appropriately, so that I can manage title generations effectively across different sessions.

#### Acceptance Criteria

1. WHEN the plugin is reloaded or Obsidian is restarted THEN the system SHALL reset all generation counters to 0
2. WHEN a note file is renamed THEN the system SHALL reset the generation counter for that note
3. WHEN a note file is deleted and recreated with the same name THEN the system SHALL treat it as a new note with counter 0
4. WHEN the user changes the generation limit setting THEN the system SHALL continue using existing counters without resetting them

### Requirement 4

**User Story:** As a user, I want clear feedback about my current generation status, so that I know how many generations I have left for each note.

#### Acceptance Criteria

1. WHEN a title generation is successful THEN the system SHALL display a notice showing the current count and remaining generations
2. WHEN the user attempts manual generation and has remaining generations THEN the system SHALL proceed with generation
3. WHEN the user attempts manual generation and has no remaining generations THEN the system SHALL display a clear error message
4. WHEN the generation limit is set to 0 (unlimited) THEN the system SHALL not display generation count information

### Requirement 5

**User Story:** As a developer, I want the new functionality to integrate seamlessly with existing code, so that it doesn't break current features and maintains code quality.

#### Acceptance Criteria

1. WHEN the new setting is added THEN the system SHALL maintain backward compatibility with existing settings
2. WHEN the generation limit feature is active THEN the system SHALL not interfere with existing trigger modes (manual, auto, semi-auto)
3. WHEN the generation limit is reached THEN the system SHALL still allow other plugin functions to work normally
4. WHEN the plugin loads THEN the system SHALL initialize the generation tracking without affecting performance
5. WHEN the generation tracking is active THEN the system SHALL use memory-efficient data structures that don't cause memory leaks