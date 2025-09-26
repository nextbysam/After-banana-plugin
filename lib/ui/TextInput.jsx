// UI Component: Text Input
// Single responsibility: Handle text input creation and management
function createTextInput(parent, properties) {
    properties = properties || {};

    var input = parent.add("edittext", undefined, properties.text || "");
    input.preferredSize.width = properties.width || 300;
    input.preferredSize.height = properties.height || 100;
    input.active = true;

    // Add change handler if provided
    if (properties.onChange) {
        input.onChange = properties.onChange;
    }

    return {
        element: input,
        getValue: function() {
            return input.text;
        },
        setValue: function(value) {
            input.text = value;
        },
        setEnabled: function(enabled) {
            input.enabled = enabled;
        }
    };
}