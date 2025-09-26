import { TextInput } from './components/TextInput.js';
import { EditButton } from './components/EditButton.js';
import { ApiService } from './services/ApiService.js';
import { TextEditorHook } from './hooks/useTextEditor.js';

class TextEditorApp {
    constructor() {
        this.apiService = new ApiService('https://your-api-endpoint.com');
        this.textEditorHook = new TextEditorHook(this.apiService);

        this.textInput = new TextInput('Enter your text here...');
        this.editButton = new EditButton('EDIT');

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        this.textInput.on('change', (text) => {
            this.textEditorHook.setText(text);
        });

        this.editButton.on('click', () => {
            this.textEditorHook.handleEdit();
        });

        this.textEditorHook.on('loadingChange', (loading) => {
            this.editButton.setLoading(loading);
        });

        this.textEditorHook.on('errorChange', (error) => {
            if (error) {
                this.showError(error);
            } else {
                this.hideError();
            }
        });

        this.textEditorHook.on('editSuccess', (response) => {
            this.showSuccess('Text edited successfully!');
            console.log('Edit response:', response);
        });
    }

    render() {
        const root = document.getElementById('root');

        const container = document.createElement('div');
        container.className = 'text-editor-container';

        const title = document.createElement('h1');
        title.textContent = 'Text Editor';
        title.className = 'title';

        const inputContainer = document.createElement('div');
        inputContainer.className = 'input-container';

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';

        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        messageContainer.id = 'messageContainer';

        container.appendChild(title);
        container.appendChild(inputContainer);
        container.appendChild(buttonContainer);
        container.appendChild(messageContainer);

        this.textInput.render(inputContainer);
        this.editButton.render(buttonContainer);

        root.appendChild(container);
    }

    showError(message) {
        const messageContainer = document.getElementById('messageContainer');
        messageContainer.innerHTML = `<div class="error-message">${message}</div>`;
    }

    showSuccess(message) {
        const messageContainer = document.getElementById('messageContainer');
        messageContainer.innerHTML = `<div class="success-message">${message}</div>`;
        setTimeout(() => this.hideError(), 3000);
    }

    hideError() {
        const messageContainer = document.getElementById('messageContainer');
        messageContainer.innerHTML = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TextEditorApp();
});