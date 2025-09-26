// Environment Configuration Utility
// Single responsibility: Handle environment variable loading
function createEnvUtils() {

    function loadEnvFile(filePath) {
        try {
            var file = new File(filePath);
            if (!file.exists) {
                throw new Error(".env file not found at: " + filePath);
            }

            file.open("r");
            var content = file.read();
            file.close();

            var envVars = {};
            var lines = content.split("\n");

            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (line && line.indexOf("=") > 0 && line.indexOf("#") !== 0) {
                    var parts = line.split("=");
                    var key = parts[0].trim();
                    var value = parts[1] ? parts[1].trim() : "";
                    envVars[key] = value;
                }
            }

            return envVars;
        } catch (error) {
            throw new Error("Failed to load .env file: " + error.toString());
        }
    }

    return {
        loadEnvFile: loadEnvFile,

        load: function(scriptPath) {
            // Get script directory and look for .env file
            var scriptFile = new File(scriptPath || $.fileName);
            var scriptFolder = scriptFile.parent;

            // Go up to parent directory to find .env (since script is in root, not lib/utils)
            var projectRoot = scriptFolder;
            var envPath = projectRoot.fsName + "/.env";

            return loadEnvFile(envPath);
        },

        getApiKey: function(envVars) {
            return envVars.FAL_KEY || "";
        },

        getEndpoint: function(envVars) {
            return envVars.FAL_ENDPOINT || "https://fal.run/fal-ai/veo3/fast";
        }
    };
}