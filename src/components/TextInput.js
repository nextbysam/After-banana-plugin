export class TextInput {
    constructor(placeholder = 'Enter text...', value = '') {
        this.element = this.createElement(placeholder, value);
        this.value = value;
        this.listeners = new Map();
    }

    createElement(placeholder, value) {
        const input = document.createElement('textarea');
        input.placeholder = placeholder;
        input.value = value;
        input.className = 'text-input';

        input.addEventListener('input', (e) => {
            this.value = e.target.value;
            this.emit('change', this.value);
        });

        return input;
    }

    getValue() {
        return this.value;
    }

    setValue(value) {
        this.value = value;
        this.element.value = value;
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