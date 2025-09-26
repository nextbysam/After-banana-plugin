export class EditButton {
    constructor(text = 'EDIT', disabled = false) {
        this.element = this.createElement(text, disabled);
        this.disabled = disabled;
        this.listeners = new Map();
    }

    createElement(text, disabled) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = 'edit-button';
        button.disabled = disabled;

        button.addEventListener('click', () => {
            if (!this.disabled) {
                this.emit('click');
            }
        });

        return button;
    }

    setDisabled(disabled) {
        this.disabled = disabled;
        this.element.disabled = disabled;
    }

    setLoading(loading) {
        this.element.textContent = loading ? 'Loading...' : 'EDIT';
        this.setDisabled(loading);
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

    render(container) {
        container.appendChild(this.element);
        return this;
    }
}