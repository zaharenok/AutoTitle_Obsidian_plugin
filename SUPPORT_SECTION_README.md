# Reusable Support Section Component

This component provides an easy way to add a consistent support section to your Obsidian plugin's settings tab.

## How to Use

1. Copy the `SupportSection.ts` file to your plugin's source directory.

2. Import and use it in your settings tab:

```typescript
import { SupportSection } from './SupportSection';

export class YourPluginSettingsTab extends PluginSettingTab {
  // ... your existing code ...
  
  display() {
    const { containerEl } = this;
    containerEl.empty();
    
    // Your existing settings...
    
    // Add support section at the bottom
    SupportSection.addSupportSection(containerEl, 'Your Plugin Name');
  }
}
```

## Customization

You can customize the links by passing an array of `SupportLink` objects:

```typescript
SupportSection.addSupportSection(containerEl, 'Your Plugin Name', [
  {
    text: '🌟 GitHub',
    url: 'https://github.com/yourusername',
    bgColor: '#24292e',
    textColor: '#ffffff'
  },
  {
    text: '💖 Sponsor',
    url: 'https://github.com/sponsors/yourusername',
    bgColor: '#db61a2',
    textColor: '#ffffff'
  }
]);
```

## Features

- Responsive design
- Hover effects
- Themed colors (respects Obsidian's theme)
- Easy to customize
- TypeScript support

## Example

![Support Section Example](https://i.imgur.com/example.png)

## License

MIT
