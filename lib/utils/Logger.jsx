// Logging Utility
// Single responsibility: Handle all logging with different levels
function createLogger() {
    var LOG_LEVELS = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        HTTP: 4
    };

    var currentLogLevel = LOG_LEVELS.DEBUG;

    // Safe object serialization for ExtendScript
    function safeStringify(obj, maxDepth) {
        maxDepth = maxDepth || 2;

        function stringify(value, depth) {
            if (depth > maxDepth) return "[Max Depth Reached]";

            if (value === null) return "null";
            if (value === undefined) return "undefined";

            var type = typeof value;
            if (type === "string") return '"' + value + '"';
            if (type === "number" || type === "boolean") return value.toString();
            if (type === "function") return "[Function]";

            if (type === "object") {
                if (value instanceof Array) {
                    var items = [];
                    for (var i = 0; i < Math.min(value.length, 5); i++) {
                        items.push(stringify(value[i], depth + 1));
                    }
                    if (value.length > 5) items.push("... +" + (value.length - 5) + " more");
                    return "[" + items.join(", ") + "]";
                } else {
                    var props = [];
                    var count = 0;
                    for (var key in value) {
                        if (count >= 5) {
                            props.push("... +more");
                            break;
                        }
                        try {
                            props.push('"' + key + '": ' + stringify(value[key], depth + 1));
                            count++;
                        } catch (e) {
                            props.push('"' + key + '": [Error accessing property]');
                        }
                    }
                    return "{" + props.join(", ") + "}";
                }
            }

            return "[Unknown Type: " + type + "]";
        }

        try {
            return stringify(obj, 0);
        } catch (e) {
            return "[Serialization Error: " + e.toString() + "]";
        }
    }

    function formatMessage(level, category, message, data) {
        var timestamp = new Date().toLocaleTimeString();
        var logMsg = "[" + timestamp + "] " + level + " [" + category + "]: " + message;

        if (data) {
            if (typeof data === "object") {
                logMsg += "\nData: " + safeStringify(data);
            } else {
                logMsg += "\nData: " + data.toString();
            }
        }

        return logMsg;
    }

    function writeLog(level, category, message, data, forceAlert) {
        var logMsg = formatMessage(level, category, message, data);

        // Write to ExtendScript console if available
        if (typeof $.writeln !== "undefined") {
            $.writeln(logMsg);
        }

        // Show critical logs as alerts
        if (forceAlert || level === "ERROR" || level === "HTTP") {
            alert(logMsg);
        }
    }

    return {
        debug: function(category, message, data) {
            writeLog("DEBUG", category, message, data, false);
        },

        info: function(category, message, data) {
            writeLog("INFO", category, message, data, false);
        },

        warn: function(category, message, data) {
            writeLog("WARN", category, message, data, false);
        },

        error: function(category, message, data) {
            writeLog("ERROR", category, message, data, true);
        },

        http: function(category, message, data) {
            writeLog("HTTP", category, message, data, true);
        },

        setLevel: function(level) {
            currentLogLevel = LOG_LEVELS[level] || LOG_LEVELS.DEBUG;
        }
    };
}