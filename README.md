# Comment Translator

Translate code comments to your preferred language directly in VS Code!

## 🌟 Features

### Core Functionality
- **Translate Selected Comment**: Select any comment and translate it instantly
- **Translate All Comments**: Automatically translate all comments in the current file
- **Hover Translation**: See comment translations without modifying your code (just hover!)

### 🚀 New in v0.1.0!
- **⚡ Translation Cache**: Lightning-fast re-translations (up to 50x faster for repeated comments)
- **🌍 Multi-Language Support**: Works with JavaScript, TypeScript, Python, HTML, CSS, Ruby, PHP
- **📊 Status Bar**: Real-time statistics showing translations count and cache size
- **↩️ Undo System**: Full history with ability to undo translations
- **🖱️ Context Menu**: Right-click to translate (when text is selected)
- **📈 Smart Batch Processing**: Optimized performance for translating multiple comments

### Advanced Features
- **9 Languages**: English, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese
- **Auto-detect Source Language**: Automatically detects the source language
- **Multiple Translation Providers**: Choose between Google Translate or LibreTranslate
- **Statistics Dashboard**: View detailed stats, cache size, and translation history
- **History Browser**: Browse and review past translations

## 🚀 Usage

### Translate Selected Comment

1. Select a comment in your code
2. **Option 1**: Right-click and select "Translate Selected Text"
3. **Option 2**: Press `Ctrl+Shift+T` (Windows/Linux) or `Cmd+Shift+T` (Mac)
4. **Option 3**: Command Palette → `Comment Translator: Translate Selected Text`

### Translate All Comments in File

1. **Option 1**: Press `Ctrl+Shift+Alt+T` (Windows/Linux) or `Cmd+Shift+Alt+T` (Mac)
2. **Option 2**: Command Palette → `Comment Translator: Translate All Comments in File`

### View Translation on Hover

Simply hover your mouse over any comment to see the translation in a popup!

### Undo Last Translation

- Command Palette → `Comment Translator: Undo Last Translation`
- Or click "Undo Last" button in notification after translating

### View Statistics

- Click on the Status Bar item (bottom-right)
- Or: Command Palette → `Comment Translator: Show Statistics`

### Clear Cache

- Command Palette → `Comment Translator: Clear Translation Cache`

## ⌨️ Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| Translate Selection | `Ctrl+Shift+T` | `Cmd+Shift+T` |
| Translate All | `Ctrl+Shift+Alt+T` | `Cmd+Shift+Alt+T` |

## ⚙️ Configuration

Access settings via `File > Preferences > Settings` and search for "Comment Translator":

- **Target Language**: Choose your preferred language (default: English)
- **Source Language**: Set a specific source language or use auto-detect (default: auto)
- **Translation Provider**: Select Google Translate (default) or LibreTranslate
- **LibreTranslate URL**: If using LibreTranslate, set your instance URL

## 🛠️ Supported Comment Styles

- Single-line comments: `// comment`
- Block comments: `/* comment */`
- Multi-line block comments:
  ```
  /*
   * comment
   */
  ```

## 🌍 Supported Languages

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Chinese (zh)
- Japanese (ja)

## 📝 Examples

**Before:**
```javascript
// Это функция для вычисления суммы
function calculateSum(a, b) {
    return a + b;
}
```

**After translation to English:**
```javascript
// This is a function to calculate the sum
function calculateSum(a, b) {
    return a + b;
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

## 🐛 Known Issues

- Translation speed depends on your internet connection
- Some technical terms might not translate perfectly
- Large files may take a while to translate all comments

## 📮 Feedback

Found a bug or have a feature request? Please open an issue on our GitHub repository!
