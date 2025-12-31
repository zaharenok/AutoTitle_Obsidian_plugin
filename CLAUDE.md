# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev          # Start development mode with file watching
npm run build        # Build for production (TypeScript + esbuild)
npm install          # Install dependencies

# Code Quality
npx eslint . --ext .ts --ignore-pattern tests/  # Lint TypeScript files (ignore tests)
npx eslint main.ts --fix                      # Lint and auto-fix main.ts
```

## Architecture Overview

This is an Obsidian plugin that uses OpenAI API to automatically generate titles for notes. The architecture follows a modular design with clear separation of concerns:

### Core Plugin (`main.ts`)
- **AutoTitlePlugin**: Main plugin class that orchestrates all functionality
- Manages plugin lifecycle, commands, ribbon icon, and event handlers
- Handles three trigger modes: manual, auto, and semi-auto title generation
- Tracks generation counts per file and user rejection preferences

### Title Management System
- **TitleManager**: Core title processing logic
- **ContentProcessor**: Handles content analysis and duplicate title detection
- **MigrationService**: Manages migration of legacy duplicate titles

Key insight: The plugin distinguishes between titles in file metadata vs titles in content. The TitleManager ensures titles only appear once (either in metadata or content, not both).

### Settings & UI
- **AutoTitleSettings**: TypeScript interface for all plugin configuration
- **AutoTitleSettingTab**: Obsidian settings UI with live validation
- **SupportSection**: Helper component for support links and documentation

### Critical Behaviors

**Title Generation Flow:**
1. Content analysis → OpenAI API call → Title suggestion → User confirmation → Title application
2. Three trigger modes with different user interaction patterns
3. Per-file generation limits to prevent API spam

**Duplicate Title Handling:**
- Legacy notes may have titles in both file metadata AND H1 headers in content
- MigrationService identifies and cleans up these duplicates
- TitleManager prevents creating new duplicates during title generation

**User Experience Protection:**
- Temporary rejection (5 minutes) and permanent rejection per file
- Generation count limits per file to prevent annoyance
- Status indicators and auto-generation cancellation options

### ESLint Configuration

The project enforces strict TypeScript/ESLint rules required for Obsidian community plugin submission:

- **No floating promises**: All async operations must be awaited or explicitly ignored with `void`
- **No unused variables**: Must prefix with `_` if intentionally unused
- **Browser compatibility**: Use `document.documentElement.lang` instead of `navigator.language`
- **Modern patterns**: Prefer `??` (nullish coalescing) over `||`, and `?.` (optional chaining)

### Development Notes

- Use `console.debug()` instead of `console.log()` for debugging
- All timers use `number` type for browser compatibility (not `NodeJS.Timeout`)
- Callback functions that return promises should use `void` to mark as intentionally floating
- File operations use Obsidian's Vault API, not direct file system access

### Plugin Submission Requirements

When preparing for Obsidian community plugin submission:
1. Ensure all ESLint errors are resolved (warnings are acceptable)
2. Manifest description must end with punctuation (.?!)
3. Release tag must match manifest.json version exactly
4. GitHub release must include compiled main.js, manifest.json, and styles.css