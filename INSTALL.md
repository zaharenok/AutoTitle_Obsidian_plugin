# AutoTitle Installation and Testing Guide

## 📦 Installing the Plugin in Obsidian

### Step 1: Prepare the Files
Make sure you have the following files in your project folder:
- `main.js` (compiled file)
- `manifest.json`
- `styles.css`

### Step 2: Copy to Obsidian
1. Open your Obsidian vault
2. Navigate to the `.obsidian/plugins/` folder (create it if it doesn't exist)
3. Create a folder named `autotitle`
4. Copy the files `main.js`, `manifest.json`, and `styles.css` into the `autotitle` folder

Final structure should look like:
```
YourVault/
└── .obsidian/
    └── plugins/
        └── autotitle/
            ├── main.js
            ├── manifest.json
            └── styles.css
```

### Step 3: Activate the Plugin
1. Restart Obsidian
2. Open Settings
3. Go to "Community plugins"
4. Enable the "AutoTitle" plugin

### Step 4: Configuration
1. In the plugin settings, enter your OpenAI API key
2. Adjust the parameters as desired
3. Save the settings

## 🧪 Testing Features

### Test 1: Manual Title Generation
1. Create a new note
2. Write a few sentences of text
3. Press `Ctrl+Shift+H`
4. Verify that a modal window appears with the suggested title

### Test 2: Automatic Generation
1. In settings, enable "Automatic generation"
2. Create a new note
3. Start writing text
4. Check if the title is generated automatically

### Test 3: Fixing Duplicates
1. Create several notes with identical titles
2. In the plugin settings, click "Fix duplicates"
3. Verify that all notes now have unique titles

### Test 4: Context Menu
1. In the file manager, right-click on a `.md` file
2. Select "Generate title with AI"
3. Verify that the function works

## 🐛 Troubleshooting

### Checking the Console
1. Open Developer Tools (`Ctrl+Shift+I`)
2. Go to the Console tab
3. Look for messages from the plugin (with the prefix "AutoTitle")

### Checking Settings
1. Make sure the API key is entered correctly
2. Check that you have sufficient funds in your OpenAI account
3. Ensure that your internet connection is working

### Common Issues

### Issue: Plugin doesn't appear in the list
- Verify that the files are copied to the correct folder
- Check that the folder structure matches the one shown above
- Restart Obsidian

### Issue: Generation isn't working
- Check your internet connection
- Make sure the API key is entered correctly
- Verify your API key usage quota

## 🔧 Development

### Development Mode
```bash
npm run dev
```

After making changes, the files will be automatically rebuilt. Just reload the plugin in Obsidian (`Ctrl+R`).

### Building a Release
```bash
npm run build
```

This creates an optimized version for distribution.

## 📋 Checklist

- [ ] Plugin appears in the Community plugins list
- [ ] Plugin settings open
- [ ] API key is saved
- [ ] Hotkeys work
- [ ] Automatic generation works
- [ ] Button in the ribbon works
- [ ] Context menu works
- [ ] Modal window displays correctly
- [ ] Titles are inserted correctly
- [ ] Files are renamed (optional)

## 💡 Usage Tips
1. **Generation quality**: The more substantial and meaningful the text, the better the title
2. **Token economy**: Use gpt-4o-mini for regular tasks (fast and cost-effective model)
3. **Languages**: The plugin automatically detects language, but you can set it manually
4. **Testing**: Start with small notes to verify functionality

---

**Done! Your AutoTitle plugin is installed and ready to use! 🎉**
