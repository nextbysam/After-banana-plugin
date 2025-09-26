// Utility: Message and Error Handling
// Single responsibility: Handle user messages and error display
function createMessageUtils() {

    return {
        // Show alert dialog
        showAlert: function(message, title) {
            alert(message, title || "Message");
        },

        // Show error dialog
        showError: function(error, title) {
            var errorMessage = typeof error === "string" ? error : error.toString();
            alert(errorMessage, title || "Error");
        },

        // Show confirmation dialog
        showConfirm: function(message, title) {
            return confirm(message, title || "Confirm");
        },

        // Log message to ExtendScript console
        log: function(message, level) {
            level = level || "INFO";
            var timestamp = new Date().toLocaleTimeString();
            var logMessage = "[" + timestamp + "] " + level + ": " + message;

            // Write to console if available
            if (typeof writeLn !== "undefined") {
                writeLn(logMessage);
            }
        },

        // Log error
        logError: function(error) {
            this.log(error.toString(), "ERROR");
        },

        // Format API response for display
        formatApiResponse: function(response) {
            if (response.success) {
                return "Success: " + (response.data || "Request completed");
            } else {
                return "Error: " + (response.error || "Unknown error occurred");
            }
        }
    };
}