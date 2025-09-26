# After Effects Text Editor Script

A modular After Effects script that provides a text editor interface with API integration and timeline manipulation capabilities.

## 🎯 Features

- **Text Input Interface**: Clean dialog with text input and edit button
- **API Integration**: Send text data to external APIs
- **Timeline Manipulation**: Create text layers directly in your composition
- **Modular Architecture**: Reusable, maintainable code components
- **Error Handling**: Comprehensive error management and user feedback

## 🔧 Installation

### Method 1: Manual Installation

1. **Locate Scripts Folder**:
   - **Windows**: `C:\Program Files\Adobe\Adobe After Effects 2025\Support Files\Scripts\`
   - **macOS**: `/Applications/Adobe After Effects 2025/Scripts/`

2. **Copy Files**:
   - Copy the entire project folder to the Scripts directory
   - Ensure all files maintain their directory structure

3. **Enable Script Permissions**:
   - Open After Effects
   - Go to `Edit > Preferences > Scripting & Expressions` (Windows)
   - Or `After Effects > Preferences > Scripting & Expressions` (macOS)
   - Check "Allow Scripts to Write Files and Access Network"

### Method 2: ScriptUI Panels (Recommended)

1. **Locate ScriptUI Panels Folder**:
   - **Windows**: `C:\Program Files\Adobe\Adobe After Effects 2025\Support Files\Scripts\ScriptUI Panels\`
   - **macOS**: `/Applications/Adobe After Effects 2025/Scripts/ScriptUI Panels/`

2. **Copy Files**: Place files in this folder for persistent panel access

## 🚀 Usage

### Running the Script

1. **From Scripts Menu**:
   - Go to `File > Scripts > TextEditor.jsx`
   - Script will open as a dialog window

2. **From Window Menu** (if installed as ScriptUI Panel):
   - Go to `Window > TextEditor`
   - Panel will dock in your workspace

### Using the Interface

1. **Text Input**:
   - Enter your text in the large text area
   - Text can be multi-line
   - Input supports standard text editing shortcuts

2. **Edit Button**:
   - Click "EDIT" to send text to API endpoint
   - Button shows "Loading..." during request
   - Success/error messages appear in dialog

3. **Create Text Layer**:
   - Click "Create Text Layer" to add text to active composition
   - Requires an active composition
   - Creates layer with entered text

### API Configuration

Edit the API URL in `TextEditor.jsx`:

```javascript
var config = {
    apiUrl: "https://your-api-endpoint.com/edit", // Change this URL
    dialogTitle: "Text Editor",
    dialogWidth: 400,
    dialogHeight: 250
};
```

## 🏗️ Architecture

The script follows a modular "Lego" architecture with clear separation of concerns:

```
/after-banana-plgin/
├── TextEditor.jsx              # Main application entry point
├── lib/
│   ├── ui/                    # UI Components
│   │   ├── Dialog.jsx         # Dialog window management
│   │   ├── TextInput.jsx      # Text input component
│   │   └── Button.jsx         # Button component
│   ├── api/                   # API Services
│   │   └── HttpClient.jsx     # HTTP request handling
│   ├── timeline/              # Timeline Utilities
│   │   └── LayerUtils.jsx     # After Effects layer operations
│   └── utils/                 # Helper Functions
│       └── MessageUtils.jsx   # Message and error handling
├── progress.md                # Development progress tracking
└── README.md                  # This file
```

## 🔧 Development

### Adding New Features

1. **UI Components**: Add to `lib/ui/` directory
2. **API Services**: Add to `lib/api/` directory
3. **Timeline Features**: Add to `lib/timeline/` directory
4. **Utilities**: Add to `lib/utils/` directory

### Code Guidelines

- **Single Responsibility**: Each file/function does one thing
- **Reusable**: Components can be combined in different ways
- **Testable**: Easy to test in isolation
- **Replaceable**: Can swap implementations without breaking dependencies

## 🛠️ Troubleshooting

### Common Issues

1. **"Allow Scripts to Write Files and Access Network" Error**:
   - Enable the option in Preferences > Scripting & Expressions

2. **"No Active Composition" Error**:
   - Create or select a composition before using layer features

3. **HTTP Request Failures**:
   - Check your API endpoint URL
   - Ensure network connectivity
   - ExtendScript has limited HTTP capabilities

4. **Script Won't Run**:
   - Check After Effects version (requires 2025+)
   - Verify file paths and permissions
   - Check ExtendScript Toolkit for errors

### Debugging

1. **ExtendScript Toolkit**:
   - Open ExtendScript Toolkit CC
   - Target After Effects
   - Set breakpoints and debug

2. **Console Logging**:
   - Messages appear in ExtendScript Toolkit console
   - Use `messageUtils.log()` for custom messages

## 📋 Requirements

- **After Effects 2025** (v25.0) or later
- **Scripts permission** enabled
- **Active project** for layer manipulation features

## 🔜 Planned Features

- [ ] Enhanced API authentication
- [ ] Multiple text formatting options
- [ ] Batch layer creation
- [ ] Animation presets
- [ ] Export functionality
- [ ] Undo/redo support

## 📝 License

This project follows standard ExtendScript practices and is compatible with After Effects 2025+.

---

*For support or feature requests, please refer to the progress.md file for development status.*