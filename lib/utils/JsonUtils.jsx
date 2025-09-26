// JSON Utilities for ExtendScript
// Single responsibility: Handle JSON operations in ExtendScript environment
function createJsonUtils() {

    // ExtendScript-compatible JSON stringify
    function stringify(obj, indent) {
        indent = indent || 0;
        var spaces = "";
        for (var i = 0; i < indent; i++) {
            spaces += " ";
        }

        if (obj === null) return "null";
        if (obj === undefined) return "undefined";

        var type = typeof obj;

        if (type === "string") {
            // Escape special characters
            var escaped = obj.replace(/\\/g, "\\\\")
                            .replace(/"/g, '\\"')
                            .replace(/\n/g, "\\n")
                            .replace(/\r/g, "\\r")
                            .replace(/\t/g, "\\t");
            return '"' + escaped + '"';
        }

        if (type === "number" || type === "boolean") {
            return obj.toString();
        }

        if (type === "object") {
            if (obj instanceof Array) {
                var items = [];
                for (var i = 0; i < obj.length; i++) {
                    items.push(stringify(obj[i], indent));
                }
                return "[" + items.join(", ") + "]";
            } else {
                var props = [];
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        var value = obj[key];
                        if (value !== undefined) {
                            props.push('"' + key + '": ' + stringify(value, indent));
                        }
                    }
                }
                return "{" + props.join(", ") + "}";
            }
        }

        return '""'; // fallback for unknown types
    }

    // ExtendScript-compatible JSON parse (basic implementation)
    function parse(jsonString) {
        if (!jsonString || typeof jsonString !== "string") {
            throw new Error("Invalid JSON string");
        }

        // Remove whitespace
        jsonString = jsonString.replace(/^\s+|\s+$/g, "");

        try {
            // Use eval for parsing in ExtendScript (controlled environment)
            // This is safe in ExtendScript context with trusted data
            return eval("(" + jsonString + ")");
        } catch (e) {
            throw new Error("JSON Parse Error: " + e.toString());
        }
    }

    // Safe JSON parse with error handling
    function safeParse(jsonString, fallback) {
        try {
            return parse(jsonString);
        } catch (e) {
            return fallback || null;
        }
    }

    // Check if string is valid JSON
    function isValidJson(jsonString) {
        try {
            parse(jsonString);
            return true;
        } catch (e) {
            return false;
        }
    }

    return {
        stringify: stringify,
        parse: parse,
        safeParse: safeParse,
        isValidJson: isValidJson
    };
}