# Obsidian Plugin Settings Page Guide

This guide documents the settings page implementation used in the AutoTitle plugin. Use this as a template for future Obsidian plugins.

## Table of Contents
- [Basic Structure](#basic-structure)
- [Setting Types](#setting-types)
- [Styling & Theming](#styling--theming)
- [Best Practices](#best-practices)
- [Example Implementation](#example-implementation)
- [How to Use It](#how-to-use-it)
- [Support & Customization](#support--customization)

## Basic Structure

The settings page follows a clean, organized layout with clear sections and helpful descriptions:

1. **Main Header**: Simple, clear title with plugin name
2. **Grouped Settings**: Related settings are grouped together with section headers
3. **Descriptions**: Each setting has a clear, concise description
4. **Visual Hierarchy**: Proper spacing and grouping for better readability

## Setting Types

### Text Input
For API keys and other text-based settings:
```typescript
new Setting(containerEl)
  .setName('OpenAI API Key')
  .setDesc('Enter your OpenAI API key for title generation')
  .addText(text => text
    .setPlaceholder('sk-...')
    .setValue(this.plugin.settings.apiKey)
    .onChange(async (value) => {
      this.plugin.settings.apiKey = value;
      await this.plugin.saveSettings();
    }));
```

### Dropdown Selector
For selecting from predefined options:
```typescript
new Setting(containerEl)
  .setName('OpenAI Model')
  .setDesc('Select the model for title generation')
  .addDropdown(dropdown => dropdown
    .addOption('gpt-4o', 'GPT-4o (Recommended)')
    .addOption('gpt-4o-mini', 'GPT-4o Mini (Fast & Cost-effective)')
    .setValue(this.plugin.settings.model)
    .onChange(async (value) => {
      this.plugin.settings.model = value;
      await this.plugin.saveSettings();
    }));
```

### Slider
For numeric values within a range:
```typescript
new Setting(containerEl)
  .setName('Creativity (Temperature)')
  .setDesc('Adjust the creativity of generation (0.0 – more conservative, 1.0 – more creative)')
  .addSlider(slider => slider
    .setLimits(0, 1, 0.1)
    .setValue(this.plugin.settings.temperature)
    .setDynamicTooltip()
    .onChange(async (value) => {
      this.plugin.settings.temperature = value;
      await this.plugin.saveSettings();
    }));
```

### Toggle Switch
For boolean options:
```typescript
new Setting(containerEl)
  .setName('Replace Mode')
  .setDesc('Automatically replace the current title without confirmation')
  .addToggle(toggle => toggle
    .setValue(this.plugin.settings.replaceMode)
    .onChange(async (value) => {
      this.plugin.settings.replaceMode = value;
      await this.plugin.saveSettings();
    }));
```

## Styling & Theming

### Color Scheme
- **Primary Color**: `var(--interactive-accent)` - Used for buttons and interactive elements
- **Text Color**: `var(--text-normal)` - For regular text
- **Muted Text**: `var(--text-muted)` - For descriptions and secondary text
- **Background**: `var(--background-primary)` - Main background
- **Secondary Background**: `var(--background-secondary)` - For section backgrounds

### Spacing
- **Section Margin**: `1.5em` between major sections
- **Setting Margin**: `0.8em` between individual settings
- **Padding**: `1em` inside containers

## Best Practices

1. **Group Related Settings**: Use section headers to group related settings
2. **Clear Descriptions**: Every setting should have a helpful description
3. **Responsive Design**: Ensure settings work well on different screen sizes
4. **Immediate Feedback**: Show visual feedback when settings are saved
5. **Validation**: Validate user input before saving

## Example Implementation

Here's a complete example of a settings tab implementation:

```typescript
export class MyPluginSettingsTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Main header
    containerEl.createEl('h2', { text: 'My Plugin – Settings' });

    // API Key Section
    containerEl.createEl('h3', { text: 'API Configuration' });
    
    new Setting(containerEl)
      .setName('API Key')
      .setDesc('Enter your API key')
      .addText(text => text
        .setPlaceholder('Enter your API key')
        .setValue(this.plugin.settings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.apiKey = value;
          await this.plugin.saveSettings();
        }));
  }
}
```

## How to Use It

1. **Install Dependencies**:
   - Make sure you have Obsidian's API types installed
   - Import necessary components from 'obsidian'

2. **Create Settings Interface**:
   - Define your plugin's settings interface
   - Set default values for all settings

3. **Initialize Settings**:
   - Load settings in your plugin's `onload` method
   - Save settings when they change

4. **Create Settings Tab**:
   - Extend `PluginSettingTab`
   - Implement the `display` method
   - Add settings using the `Setting` class

5. **Register Settings Tab**:
   ```typescript
   this.addSettingTab(new MyPluginSettingsTab(this.app, this));
   ```

## Support & Customization

### Custom CSS
You can add custom CSS to style your settings page:

```typescript
// In your settings tab's display method
containerEl.createEl('style', {
  text: `
    .my-custom-setting {
      border-left: 3px solid var(--interactive-accent);
      padding-left: 10px;
    }
  `
});
```

### Icons
Use Obsidian's built-in icons or add your own:
```typescript
// In your plugin's onload method
this.addRibbonIcon('pencil', 'My Plugin', () => {
  // Action when clicked
});
```

### Support & Feedback
For support or to report issues, please [open an issue on GitHub](https://github.com/yourusername/your-plugin/issues).

---

Designed with ❤️ for the Obsidian community  
[Buy me a coffee ☕](https://www.buymeacoffee.com/yourusername)
