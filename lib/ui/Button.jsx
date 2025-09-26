// UI Component: Button
// Single responsibility: Handle button creation and state management
function createButton(parent, properties) {
    properties = properties || {};

    var button = parent.add("button", undefined, properties.text || "Button");
    button.preferredSize.width = properties.width || 100;
    button.preferredSize.height = properties.height || 30;

    var originalText = properties.text || "Button";

    return {
        element: button,
        onClick: function(callback) {
            button.onClick = callback;
        },
        setText: function(text) {
            button.text = text;
        },
        setEnabled: function(enabled) {
            button.enabled = enabled;
        },
        setLoading: function(loading) {
            if (loading) {
                button.text = "Loading...";
                button.enabled = false;
            } else {
                button.text = originalText;
                button.enabled = true;
            }
        },
        getOriginalText: function() {
            return originalText;
        }
    };
}