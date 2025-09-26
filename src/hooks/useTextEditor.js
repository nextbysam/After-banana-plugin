export class TextEditorHook {
    constructor(apiService, initialText = '') {
        this.apiService = apiService;
        this.text = initialText;
        this.isLoading = false;
        this.error = null;
        this.listeners = new Map();
    }

    getText() {
        return this.text;
    }

    setText(text) {
        this.text = text;
        this.emit('textChange', text);
    }

    getIsLoading() {
        return this.isLoading;
    }

    getError() {
        return this.error;
    }

    setLoading(loading) {
        this.isLoading = loading;
        this.emit('loadingChange', loading);
    }

    setError(error) {
        this.error = error;
        this.emit('errorChange', error);
    }

    async handleEdit() {
        if (!this.text.trim()) {
            this.setError('Please enter some text to edit');
            return;
        }

        try {
            this.setLoading(true);
            this.setError(null);

            const response = await this.apiService.post('/edit', {
                text: this.text,
                timestamp: Date.now()
            });

            this.emit('editSuccess', response);
        } catch (error) {
            this.setError(`Edit failed: ${error.message}`);
            this.emit('editError', error);
        } finally {
            this.setLoading(false);
        }
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, data) {
        const callbacks = this.listeners.get(event) || [];
        callbacks.forEach(callback => callback(data));
    }

    destroy() {
        this.listeners.clear();
    }
}