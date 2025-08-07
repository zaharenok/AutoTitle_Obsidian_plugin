import { App, PluginSettingTab, Setting } from 'obsidian';
import AutoTitlePlugin from './main';

export class AutoTitleSettingTab extends PluginSettingTab {
  plugin: AutoTitlePlugin;

  constructor(app: App, plugin: AutoTitlePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'AutoTitle – Settings' });

    // OpenAI API Key
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

    // Model
    new Setting(containerEl)
      .setName('OpenAI Model')
      .setDesc('Select the model for title generation')
      .addDropdown(dropdown => dropdown
        .addOption('gpt-4o', 'GPT-4o (Recommended)')
        .addOption('gpt-4o-mini', 'GPT-4o Mini (Fast & Cost-effective)')
        .addOption('gpt-4-turbo', 'GPT-4 Turbo')
        .addOption('gpt-4', 'GPT-4')
        .addOption('gpt-3.5-turbo', 'GPT-3.5 Turbo (Legacy)')
        .setValue(this.plugin.settings.model)
        .onChange(async (value) => {
          this.plugin.settings.model = value;
          await this.plugin.saveSettings();
        }));

    // Temperature
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

    // Trigger Mode
    new Setting(containerEl)
      .setName('Trigger Mode')
      .setDesc('Choose how titles are generated: Manual (hotkey only), Auto (after typing pause), or Semi-auto (shows button after pause)')
      .addDropdown(dropdown => dropdown
        .addOption('manual', 'Manual (hotkey only)')
        .addOption('semi-auto', 'Semi-auto (button after pause)')
        .addOption('auto', 'Auto (after typing pause)')
        .setValue(this.plugin.settings.triggerMode)
        .onChange(async (value) => {
          this.plugin.settings.triggerMode = value as 'manual' | 'auto' | 'semi-auto';
          await this.plugin.saveSettings();
        }));

    // Title Language
    new Setting(containerEl)
      .setName('Title Language')
      .setDesc('Select the language for the generated title')
      .addDropdown(dropdown => dropdown
        .addOption('auto', 'Auto (detect from note language)')
        .addOption('en', 'English')
        .addOption('ru', 'Russian')
        .addOption('zh', 'Chinese')
        .addOption('es', 'Spanish')
        .setValue(this.plugin.settings.language || 'auto')
        .onChange(async (value) => {
          this.plugin.settings.language = value;
          await this.plugin.saveSettings();
        }));

    // Replace mode
    new Setting(containerEl)
      .setName('Replace Mode')
      .setDesc('Automatically replace the current title without confirmation')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.replaceMode)
        .onChange(async (value) => {
          this.plugin.settings.replaceMode = value;
          await this.plugin.saveSettings();
        }));

    // Minimum Content Length
    new Setting(containerEl)
      .setName('Minimum Content Length')
      .setDesc('Minimum number of characters required before auto-generation triggers')
      .addText(text => text
        .setPlaceholder('100')
        .setValue(this.plugin.settings.minContentLength.toString())
        .onChange(async (value) => {
          const length = parseInt(value);
          if (!isNaN(length) && length > 0) {
            this.plugin.settings.minContentLength = length;
            await this.plugin.saveSettings();
          }
        }));

    // Timeout
    new Setting(containerEl)
      .setName('Auto-generation Timeout (ms)')
      .setDesc('Waiting time after you stop typing before showing generation option')
      .addText(text => text
        .setPlaceholder('5000')
        .setValue(this.plugin.settings.timeout.toString())
        .onChange(async (value) => {
          const timeout = parseInt(value);
          if (!isNaN(timeout) && timeout > 0) {
            this.plugin.settings.timeout = timeout;
            await this.plugin.saveSettings();
          }
        }));

    // Show Indicator
    new Setting(containerEl)
      .setName('Show Generation Indicator')
      .setDesc('Show a notification 1 second before auto-generation in auto mode')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showIndicator)
        .onChange(async (value) => {
          this.plugin.settings.showIndicator = value;
          await this.plugin.saveSettings();
        }));

    // Generation Count
    new Setting(containerEl)
      .setName('How many times do you want to generate title for 1 note')
      .setDesc('Set how many times the title should be generated for a single note (1 = generate only once)')
      .addText(text => text
        .setPlaceholder('1')
        .setValue(this.plugin.settings.generationCount.toString())
        .onChange(async (value) => {
          const count = parseInt(value);
          if (!isNaN(count) && count > 0) {
            this.plugin.settings.generationCount = count;
            await this.plugin.saveSettings();
          }
        }));

    // Maximum Title Length
    new Setting(containerEl)
      .setName('Maximum Title Length')
      .setDesc('Maximum number of characters for generated titles (titles will be truncated if longer)')
      .addText(text => text
        .setPlaceholder('100')
        .setValue(this.plugin.settings.maxTitleLength.toString())
        .onChange(async (value) => {
          const length = parseInt(value);
          if (!isNaN(length) && length > 0) {
            this.plugin.settings.maxTitleLength = length;
            await this.plugin.saveSettings();
          }
        }));

    // Include Existing Title
    new Setting(containerEl)
      .setName('Include Existing Title in Generation')
      .setDesc('When enabled, the existing title will be considered during generation. When disabled, only note content is used.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.includeExistingTitle)
        .onChange(async (value) => {
          this.plugin.settings.includeExistingTitle = value;
          await this.plugin.saveSettings();
        }));

    // Duplication Handling Section
    containerEl.createEl('h3', { text: 'Duplication Handling' });
    
    const duplicationInfo = containerEl.createDiv();
    duplicationInfo.innerHTML = `
      <p>This plugin prevents duplicate titles from appearing both in the note title and content. 
      Use the commands below to fix existing notes with duplicate titles.</p>
    `;
    
    const duplicationButtons = containerEl.createDiv();
    duplicationButtons.style.display = 'flex';
    duplicationButtons.style.gap = '10px';
    duplicationButtons.style.marginTop = '10px';
    
    const fixAllButton = duplicationButtons.createEl('button', { text: 'Fix All Notes' });
    fixAllButton.onclick = async () => {
      await this.plugin.fixAllDuplicatedTitles();
    };
    
    const fixCurrentButton = duplicationButtons.createEl('button', { text: 'Fix Current Note' });
    fixCurrentButton.onclick = async () => {
      await this.plugin.fixCurrentNoteTitleFromSettings();
    };

    // Reset rejected files section
    containerEl.createEl('h3', { text: 'Auto-generation Control' });
    const rejectedInfo = containerEl.createDiv();
    rejectedInfo.innerHTML = `
      <p>When you reject title suggestions, those notes are remembered and won't show auto-generation prompts again. 
      Use the button below to reset this list and allow auto-generation for all notes again.</p>
    `;
    
    const resetRejectedDiv = containerEl.createDiv();
    resetRejectedDiv.style.marginTop = '10px';
    
    const resetRejectedButton = resetRejectedDiv.createEl('button', { text: 'Reset Rejected Files' });
    resetRejectedButton.onclick = () => {
      this.plugin.resetRejectedFiles();
    };
    
    // Show count of rejected files
    const rejectedCount = this.plugin.getRejectedFilesCount();
    if (rejectedCount > 0) {
      const countSpan = resetRejectedDiv.createEl('span', { 
        text: ` (${rejectedCount} files currently rejected)` 
      });
      countSpan.style.marginLeft = '10px';
      countSpan.style.color = 'var(--text-muted)';
      countSpan.style.fontSize = '0.9em';
    }

    // Info
    containerEl.createEl('h3', { text: 'Usage' });
    const infoDiv = containerEl.createDiv();
    infoDiv.innerHTML = `
      <p><strong>Hotkeys:</strong></p>
      <ul>
        <li><code>Ctrl+Shift+H</code> – Generate a title for the current note</li>
        <li><code>Ctrl+Shift+Alt+H</code> – Generate title without confirmation</li>
      </ul>
      <p><strong>How to use:</strong></p>
      <ul>
        <li>Enter your OpenAI API key in the settings</li>
        <li>Choose your preferred trigger mode:</li>
        <ul>
          <li><strong>Manual:</strong> Use hotkey only</li>
          <li><strong>Semi-auto:</strong> Shows button after typing pause</li>
          <li><strong>Auto:</strong> Generates after typing pause</li>
        </ul>
        <li>Write text in your note</li>
        <li>Generate title using hotkey or automatic suggestion</li>
        <li>Confirm or reject the suggested title</li>
      </ul>
    `;

    // Support Section
    containerEl.createEl('h3', { text: 'Support the Developer' });
    const supportDiv = containerEl.createDiv();
    supportDiv.style.display = 'flex';
    supportDiv.style.gap = '15px';
    supportDiv.style.alignItems = 'center';
    supportDiv.style.marginTop = '10px';
    
    const githubLink = supportDiv.createEl('a', {
      text: '⭐ GitHub',
      href: 'https://github.com/zaharenok'
    });
    githubLink.style.textDecoration = 'none';
    githubLink.style.padding = '8px 16px';
    githubLink.style.backgroundColor = 'var(--interactive-accent)';
    githubLink.style.color = 'var(--text-on-accent)';
    githubLink.style.borderRadius = '4px';
    githubLink.style.fontWeight = 'bold';
    githubLink.style.whiteSpace = 'nowrap';
    githubLink.style.display = 'inline-block';
    githubLink.style.minWidth = 'fit-content';
    githubLink.setAttribute('target', '_blank');
    
    const coffeeLink = supportDiv.createEl('a', {
      text: '☕ Buy Me a Coffee',
      href: 'https://buymeacoffee.com/olegzakhark'
    });
    coffeeLink.style.textDecoration = 'none';
    coffeeLink.style.padding = '8px 16px';
    coffeeLink.style.backgroundColor = '#FFDD00';
    coffeeLink.style.color = '#000';
    coffeeLink.style.borderRadius = '4px';
    coffeeLink.style.fontWeight = 'bold';
    coffeeLink.style.whiteSpace = 'nowrap';
    coffeeLink.style.display = 'inline-block';
    coffeeLink.style.minWidth = 'fit-content';
    coffeeLink.setAttribute('target', '_blank');
    
    const supportText = supportDiv.createEl('span', {
      text: 'If you find this plugin helpful, please consider supporting its development!'
    });
    supportText.style.fontSize = '0.9em';
    supportText.style.color = 'var(--text-muted)';
  }
}
