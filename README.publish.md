# AutoTitle - AI-Powered Title Generator for Obsidian

Automatically generate meaningful titles for your Obsidian notes using OpenAI's latest and most powerful language models.

## 🚀 Features

- 🤖 **Latest AI Models** - Powered by OpenAI's latest GPT models including GPT-4.1, GPT-4.1 mini, GPT-4.1 nano, GPT-4o, and GPT-4o-mini
- 🔄 **Flexible Generation Modes** - Manual, semi-automatic, or fully automatic title generation
- 🌍 **Multi-language Support** - Auto-detect language or choose from 20+ supported languages
- ⚡ **Instant Generation** - Quick hotkey access with `Ctrl+Shift+H` (Windows/Linux) or `Cmd+Shift+H` (Mac)
- 🎛️ **Customizable Settings** - Fine-tune AI behavior, creativity level, and generation preferences
- 📝 **Smart Integration** - Seamlessly integrates with your existing Obsidian workflow
- 🔒 **Privacy-First** - Your API key stays local, no data logging or storage

## 📦 Installation

### From Obsidian Community Plugins (Recommended)

1. Open **Obsidian Settings**
2. Navigate to **Community Plugins** and disable **Safe Mode**
3. Click **Browse** and search for **"AutoTitle"**
4. Click **Install** and then **Enable**

### Manual Installation

1. Download the latest release files (`main.js`, `manifest.json`, `styles.css`)
2. Create folder: `VaultFolder/.obsidian/plugins/autotitle/`
3. Copy the files to this folder
4. Restart Obsidian and enable the plugin

## ⚙️ Setup & Configuration

### Getting Your OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click **"Create new secret key"**
5. Copy the generated key (starts with `sk-`)

### Plugin Configuration

1. Open **Obsidian Settings**
2. Go to **Community Plugins** → **AutoTitle**
3. Paste your OpenAI API key
4. Configure your preferred settings

## 🎯 Usage Guide

### Quick Start

1. Write content in your note (minimum 100 characters recommended)
2. Press `Ctrl+Shift+H` (Windows/Linux) or `Cmd+Shift+H` (Mac)
3. Review the AI-generated title suggestion
4. Click **Accept** to apply or **Reject** to dismiss

### Generation Modes

#### Manual Mode (Default)

- **Best for**: Full control over title generation
- **How it works**: Use hotkey only when you want a title
- **Recommended for**: Users who prefer explicit control

#### Semi-Auto Mode

- **Best for**: Balanced automation with user control
- **How it works**: Shows generation button after typing pause
- **Recommended for**: Users who want suggestions without interruption

#### Auto Mode

- **Best for**: Seamless, hands-free experience
- **How it works**: Automatically generates titles after typing pause
- **Recommended for**: Power users who want maximum automation

## 🤖 AI Models Explained

### GPT-4.1 (Latest Flagship Model)

- **Best for**: Superior coding and instruction following
- **Strengths**: Enhanced reasoning, precise instruction following, 1M context window
- **Cost**: Premium pricing
- **Use when**: You need the highest quality and most advanced capabilities

### GPT-4.1 mini (Recommended for Most Users)

- **Best for**: Balanced performance and cost-effectiveness
- **Strengths**: Improved coding abilities, better instruction following than GPT-4o
- **Cost**: Moderate pricing
- **Use when**: You want latest improvements with reasonable cost

### GPT-4.1 nano (Most Economical)

- **Best for**: Fast, lightweight title generation
- **Strengths**: Quick responses, lowest cost in GPT-4.1 family
- **Cost**: Most economical option
- **Use when**: Budget is primary concern but you want latest model family

### GPT-4o (Proven Quality)

- **Best for**: High-quality, nuanced titles
- **Strengths**: Superior understanding of context and tone
- **Cost**: Standard pricing
- **Use when**: You prefer the established GPT-4o performance

### GPT-4o-mini (Cost-Effective)

- **Best for**: Fast, cost-effective generation
- **Strengths**: Excellent balance of quality and speed
- **Cost**: Budget-friendly option
- **Use when**: You need frequent title generation at low cost

## ⚙️ Settings Reference

| Setting                      | Description                                 | Options                                                  | Default     |
| ---------------------------- | ------------------------------------------- | -------------------------------------------------------- | ----------- |
| **OpenAI API Key**           | Your personal API key                       | Text input                                               | Required    |
| **AI Model**                 | Choose the AI model                         | GPT-4.1, GPT-4.1 mini, GPT-4.1 nano, GPT-4o, GPT-4o-mini | GPT-4o-mini |
| **Creativity (Temperature)** | Controls randomness in generation           | 0.0 (conservative) - 1.0 (creative)                      | 0.3         |
| **Trigger Mode**             | How titles are generated                    | Manual, Semi-auto, Auto                                  | Manual      |
| **Language**                 | Target language for titles                  | Auto-detect, English, Spanish, French, etc.              | Auto-detect |
| **Replace Mode**             | Skip confirmation dialog                    | On/Off                                                   | Off         |
| **Min Content Length**       | Minimum characters before generation        | Number (characters)                                      | 100         |
| **Timeout**                  | Delay after typing stops                    | Milliseconds                                             | 5000        |
| **Show Indicator**           | Display notification before auto-generation | On/Off                                                   | On          |
| **Generation Count**         | Max generations per note                    | Number                                                   | 1           |

## 🌍 Supported Languages

AutoTitle automatically detects and generates titles in:

**European Languages:**

- English, Spanish, French, German, Italian, Portuguese, Russian, Polish, Dutch, Swedish, Norwegian, Danish

**Asian Languages:**

- Chinese (Simplified & Traditional), Japanese, Korean, Hindi, Bengali, Arabic, Thai, Vietnamese

**And many more through intelligent auto-detection!**

## 💡 Usage Examples

### Academic Note

**Input:**

```
The concept of neuroplasticity refers to the brain's ability to reorganize
itself by forming new neural connections throughout life. This remarkable
capacity allows the brain to compensate for injury and disease and to
adjust their activities in response to new situations or changes in their
environment.
```

**Generated Title:**

```
# Understanding Neuroplasticity: The Brain's Ability to Adapt and Reorganize
```

### Meeting Notes

**Input:**

```
Discussed Q4 marketing strategy with the team. Key points: increase social
media presence, launch influencer partnerships, focus on video content,
and allocate 30% more budget to digital advertising. Next steps include
creating content calendar and identifying potential influencers.
```

**Generated Title:**

```
# Q4 Marketing Strategy Meeting: Social Media and Influencer Focus
```

### Personal Journal

**Input:**

```
Today was challenging but rewarding. Started the morning with meditation,
which helped center my thoughts. The presentation at work went better than
expected, and I received positive feedback from the team. Feeling grateful
for the support and looking forward to tomorrow's challenges.
```

**Generated Title:**

```
# A Challenging Yet Rewarding Day: Meditation, Success, and Gratitude
```

## 🔧 Troubleshooting

### Common Issues

#### "API Key Invalid" Error

- **Solution**: Verify your API key is correct and active
- **Check**: Ensure the key starts with `sk-` and has no extra spaces
- **Verify**: Log into OpenAI platform to confirm key status

#### "Insufficient Credits" Error

- **Solution**: Add credits to your OpenAI account
- **Check**: Visit [OpenAI Billing](https://platform.openai.com/account/billing)
- **Note**: New accounts often include free credits

#### Titles in Wrong Language

- **Solution**: Set specific language instead of auto-detect
- **Tip**: Ensure your note has enough content for accurate detection
- **Alternative**: Try different AI models for better language handling

#### Auto-generation Not Working

- **Check**: Trigger mode is set to "Auto" or "Semi-auto"
- **Verify**: Content meets minimum length requirement
- **Adjust**: Increase timeout if generation happens too quickly
- **Test**: Try manual generation first to verify setup

#### Slow Generation

- **Solution**: Switch to GPT-4.1 nano or GPT-4o-mini for faster responses
- **Check**: Your internet connection stability
- **Consider**: OpenAI API response times vary by demand

### Performance Tips

1. **For Speed**: Use GPT-4.1 nano or GPT-4o-mini model
2. **For Quality**: Use GPT-4.1 or GPT-4o model
3. **For Cost**: Use GPT-4.1 nano or GPT-4o-mini
4. **For Latest Features**: Use GPT-4.1 family models
5. **For Accuracy**: Provide more context in your notes
6. **For Consistency**: Set specific language instead of auto-detect

## 🔒 Privacy & Security

- **Local Storage**: Your API key is stored only in your local Obsidian settings
- **No Logging**: The plugin doesn't log or store any of your content
- **Direct Communication**: Your notes are sent directly to OpenAI's API
- **User Control**: You control what content is sent for title generation
- **No Tracking**: No analytics or usage tracking implemented

## 💰 Cost Considerations

Title generation costs depend on your chosen model:

- **GPT-4.1 nano**: ~$0.0001-0.0003 per title (most economical)
- **GPT-4o-mini**: ~$0.0002-0.0004 per title (budget-friendly)
- **GPT-4.1 mini**: ~$0.0005-0.001 per title (balanced)
- **GPT-4o**: ~$0.001-0.003 per title (standard)
- **GPT-4.1**: ~$0.002-0.005 per title (premium)

_Costs are approximate and depend on content length and OpenAI's current pricing._

## 🆘 Support & Community

### Getting Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/zaharenok/AutoTitle-Obsidian-Plugin-Publish/issues)
- **Obsidian Forum**: Search for "AutoTitle" in community discussions
- **Documentation**: Comprehensive guides available in the repository

### Contributing

- **Feedback**: Share your experience and suggestions
- **Bug Reports**: Help improve the plugin by reporting issues
- **Feature Requests**: Suggest new functionality

## 📄 License

```
MIT License

Copyright (c) 2025 zaharenok

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

This plugin is released under the MIT License. See the repository for full license details.

## 🙏 Acknowledgments

- **OpenAI** for providing powerful language models
- **Obsidian Team** for creating an amazing platform
- **Community Contributors** for feedback and suggestions
- **Plugin Users** for making this project worthwhile

---

**Made with ❤️ for the Obsidian community**

_Transform your note-taking with AI-powered titles. Install AutoTitle today and experience the future of intelligent note organization._
