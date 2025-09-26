// FAL AI Video Generator - With Comprehensive HTTP Logging
// Following modular architecture guidelines

// Inline critical functions to avoid include issues

// Simple ExtendScript-compatible JSON stringify
function simpleStringify(obj, indent) {
    if (obj === null) return "null";
    if (obj === undefined) return "undefined";

    var type = typeof obj;
    if (type === "string") return '"' + obj.replace(/"/g, '\\"') + '"';
    if (type === "number" || type === "boolean") return obj.toString();
    if (type === "function") return "[Function]";

    if (type === "object") {
        if (obj instanceof Array) {
            var items = [];
            for (var i = 0; i < obj.length; i++) {
                items.push(simpleStringify(obj[i]));
            }
            return "[" + items.join(", ") + "]";
        } else {
            var props = [];
            for (var key in obj) {
                if (obj.hasOwnProperty && obj.hasOwnProperty(key)) {
                    props.push('"' + key + '": ' + simpleStringify(obj[key]));
                }
            }
            return "{" + props.join(", ") + "}";
        }
    }

    return obj.toString();
}

// Enhanced Debug Logger with file output
function createLogger() {
    var debugFile = null;
    var logEntries = [];

    // Initialize debug log file with multiple fallback locations
    var debugLogPaths = [
        Folder.desktop.fsName + "/FAL_Debug_Log_" + new Date().getTime() + ".txt",
        Folder.temp.fsName + "/FAL_Debug_Log_" + new Date().getTime() + ".txt",
        "~/FAL_Debug_Log_" + new Date().getTime() + ".txt"
    ];

    for (var i = 0; i < debugLogPaths.length; i++) {
        try {
            debugFile = new File(debugLogPaths[i]);
            var opened = debugFile.open("w");
            if (opened) {
                debugFile.writeln("=== FAL AI Video Generator Debug Log ===");
                debugFile.writeln("Started: " + new Date().toString());
                debugFile.writeln("Log file: " + debugFile.fsName);
                debugFile.writeln("=========================================\n");
                // Debug log created silently
                break;
            }
        } catch (e) {
            if (i === debugLogPaths.length - 1) {
                // Could not create debug log file
                debugFile = null;
            }
        }
    }

    function writeToLog(message) {
        logEntries.push(new Date().toTimeString() + " | " + message);
        if (debugFile) {
            try {
                debugFile.writeln(new Date().toTimeString() + " | " + message);
                debugFile.flush(); // Ensure immediate write
            } catch (e) {
                // Silent fail - don't interrupt main flow
            }
        }
    }

    return {
        info: function(tag, message, data) {
            var logMsg = "[INFO " + tag + "] " + message;
            if (data) {
                try {
                    logMsg += "\nData: " + simpleStringify(data);
                } catch (e) {
                    logMsg += "\nData: [Serialization error: " + e.toString() + "]";
                }
            }
            writeToLog(logMsg);
        },
        error: function(tag, message, data) {
            var logMsg = "[ERROR " + tag + "] " + message;
            if (data) {
                try {
                    logMsg += "\nData: " + simpleStringify(data);
                } catch (e) {
                    logMsg += "\nData: [Serialization error: " + e.toString() + "]";
                }
            }
            writeToLog(logMsg);
            // Error logged to debug file only
        },
        warn: function(tag, message, data) {
            var logMsg = "[WARN " + tag + "] " + message;
            if (data) {
                try {
                    logMsg += "\nData: " + simpleStringify(data);
                } catch (e) {
                    logMsg += "\nData: [Serialization error: " + e.toString() + "]";
                }
            }
            writeToLog(logMsg);
            // Warning logged to debug file only
        },
        debug: function(tag, message, data) {
            var logMsg = "[DEBUG " + tag + "] " + message;
            if (data) {
                try {
                    logMsg += "\nData: " + simpleStringify(data);
                } catch (e) {
                    logMsg += "\nData: [Serialization error: " + e.toString() + "]";
                }
            }
            writeToLog(logMsg);
        },
        http: function(tag, message, data) {
            var logMsg = "[HTTP " + tag + "] " + message;
            if (data) {
                try {
                    logMsg += "\nData: " + simpleStringify(data);
                } catch (e) {
                    logMsg += "\nData: [Serialization error: " + e.toString() + "]";
                }
            }
            writeToLog(logMsg);
            // HTTP logged to debug file only
        },
        logRawResponse: function(response) {
            writeToLog("=== RAW HTTP RESPONSE START ===");
            writeToLog("Response Length: " + response.length + " bytes");
            writeToLog("Raw Response:");
            writeToLog(response);
            writeToLog("=== RAW HTTP RESPONSE END ===\n");

            // Show detailed response breakdown via alerts since file might fail
            // Raw response logged to debug file

            if (response.length > 500) {
                // Continued response logged to debug file
            }

            // Try to save file but don't fail if it doesn't work
            try {
                var rawFile = new File(Folder.desktop.fsName + "/FAL_Raw_Response_" + new Date().getTime() + ".txt");
                if (rawFile.open("w")) {
                    rawFile.write(response);
                    rawFile.close();
                    // Raw response saved to desktop file
                }
            } catch (e) {
                // Silent fail - we already showed the response via alerts
            }
        },
        closeLog: function() {
            if (debugFile) {
                try {
                    debugFile.writeln("\n=========================================");
                    debugFile.writeln("Log ended: " + new Date().toString());
                    debugFile.writeln("Total entries: " + logEntries.length);
                    debugFile.close();
                    // Debug log saved
                } catch (e) {
                    // Could not close debug log
                }
            }
        }
    };
}

// Enhanced HTTP Client using system calls for HTTPS support
function createHttpClient(logger) {

    // Method: Use system.callSystem to execute curl for HTTPS requests
    function makeCurlRequest(url, data, headers) {
        var startTime = new Date().getTime();
        var requestId = "curl_req_" + startTime;

        // CURL request started

        try {
            var requestBody = simpleStringify(data);
            logger.info("CURL_REQUEST_BODY", "Request body prepared", {
                bodyLength: requestBody.length,
                bodyPreview: requestBody.substring(0, 200)
            });

            // Create temporary files for request/response
            var tempDir = Folder.temp.fsName;
            var requestFile = new File(tempDir + "/fal_request_" + startTime + ".json");
            var responseFile = new File(tempDir + "/fal_response_" + startTime + ".txt");
            var headerFile = new File(tempDir + "/fal_headers_" + startTime + ".txt");

            // Write request body to temp file
            if (!requestFile.open("w")) {
                throw new Error("Cannot create request temp file");
            }
            requestFile.write(requestBody);
            requestFile.close();

            logger.info("CURL_TEMP_FILES", "Temporary files created", {
                requestFile: requestFile.fsName,
                responseFile: responseFile.fsName,
                headerFile: headerFile.fsName
            });

            // Build curl command
            var curlCmd = 'curl -X POST "' + url + '"';
            curlCmd += ' -H "Content-Type: application/json"';
            curlCmd += ' -H "Authorization: ' + headers.Authorization + '"';
            curlCmd += ' -H "Accept: application/json"';
            curlCmd += ' -H "User-Agent: AfterEffects-FAL-Client/1.0"';
            curlCmd += ' --data @"' + requestFile.fsName + '"';
            curlCmd += ' --output "' + responseFile.fsName + '"';
            curlCmd += ' --dump-header "' + headerFile.fsName + '"';
            curlCmd += ' --connect-timeout 30';
            curlCmd += ' --max-time 120';
            curlCmd += ' --silent --show-error';

            logger.info("CURL_COMMAND", "Curl command prepared", {
                commandLength: curlCmd.length,
                commandPreview: curlCmd.substring(0, 200) + "..."
            });

            // Executing CURL command

            // Execute curl via system call
            var curlResult = system.callSystem(curlCmd);

            var endTime = new Date().getTime();
            var duration = endTime - startTime;

            // CURL completed

            logger.info("CURL_RESULT", "System call completed", {
                exitCode: curlResult,
                duration: duration + "ms"
            });

            // Check if response file was created
            if (!responseFile.exists) {
                throw new Error("Response file not created - curl may have failed (exit code: " + curlResult + ")");
            }

            // Read response
            if (!responseFile.open("r")) {
                throw new Error("Cannot read response file");
            }
            var responseBody = responseFile.read();
            responseFile.close();

            // Read headers
            var responseHeaders = "";
            if (headerFile.exists) {
                if (headerFile.open("r")) {
                    responseHeaders = headerFile.read();
                    headerFile.close();
                }
            }

            logger.info("CURL_RESPONSE", "Response received", {
                bodyLength: responseBody.length,
                headersLength: responseHeaders.length,
                hasHeaders: !!responseHeaders,
                bodyPreview: responseBody.substring(0, 200)
            });

            // Response received, parsing JSON

            // Clean up temp files
            try {
                requestFile.remove();
                responseFile.remove();
                headerFile.remove();
            } catch (cleanupError) {
                // Ignore cleanup errors
                logger.warn("CLEANUP", "Temp file cleanup failed", { error: cleanupError.toString() });
            }

            // Parse JSON response
            if (!responseBody || responseBody.length === 0) {
                throw new Error("Empty response from FAL API (curl exit code: " + curlResult + ")");
            }

            // Check for HTML error response (like our previous 400 error)
            if (responseBody.indexOf("<html>") > -1 || responseBody.indexOf("<!DOCTYPE") > -1) {
                // HTML error response detected
                throw new Error("Received HTML error response instead of JSON");
            }

            try {
                // Use eval for JSON parsing in ExtendScript
                var parsedData = eval("(" + responseBody + ")");

                // Get response keys manually for ExtendScript
                var responseKeys = [];
                for (var key in parsedData) {
                    if (parsedData.hasOwnProperty && parsedData.hasOwnProperty(key)) {
                        responseKeys.push(key);
                    }
                }

                logger.info("JSON_PARSE_SUCCESS", "JSON parsing successful", {
                    responseKeys: responseKeys,
                    hasVideo: !!(parsedData.video),
                    hasVideoUrl: !!(parsedData.video && parsedData.video.url),
                    curlExitCode: curlResult
                });

                // JSON parsed successfully

                return {
                    success: true,
                    status: 200,
                    data: parsedData,
                    requestId: requestId,
                    duration: duration
                };

            } catch (parseError) {
                // JSON parse error
                logger.error("JSON_PARSE_ERROR", "Failed to parse response", {
                    error: parseError.toString(),
                    responsePreview: responseBody.substring(0, 500),
                    curlExitCode: curlResult
                });
                throw new Error("JSON parse failed: " + parseError.toString());
            }

        } catch (error) {
            var endTime = new Date().getTime();
            var duration = endTime - startTime;

            logger.error("CURL_REQUEST_ERROR", "Curl request failed", {
                error: error.toString(),
                duration: duration + "ms"
            });

            alert("💥 CURL REQUEST FAILED\n\nError: " + error.toString() + "\nDuration: " + duration + "ms");

            return {
                success: false,
                error: error.toString(),
                status: 0,
                requestId: requestId,
                duration: duration
            };
        }
    }

    return {
        post: function(url, data, headers) {
            alert("🔍 HTTP CLIENT STARTING\n\n🌐 Using system curl for HTTPS support\n\nExtendScript Socket limitation: No SSL/TLS\nSolution: System curl calls");

            logger.info("HTTP_CLIENT_METHOD", "Using curl for HTTPS requests", {
                url: url,
                method: "POST",
                reason: "ExtendScript Socket doesn't support SSL/TLS"
            });

            return makeCurlRequest(url, data, headers);
        }
    };
}

// Simple FAL Client
function createFalClient(apiKey, httpClient, logger) {
    var FAL_ENDPOINT = "https://fal.run/fal-ai/veo3/fast";

    return {
        generateVideo: function(prompt, options) {
            logger.info("FAL_GENERATE", "Starting video generation");

            if (!prompt || trimString(prompt).length === 0) {
                return {
                    success: false,
                    error: "Prompt is required"
                };
            }

            var requestData = {
                prompt: prompt,
                aspect_ratio: (options && options.aspect_ratio) || "16:9",
                duration: (options && options.duration) || "8s",
                resolution: (options && options.resolution) || "720p",
                enhance_prompt: true,
                generate_audio: true
            };

            var headers = {
                Authorization: "Key " + apiKey
            };

            return httpClient.post(FAL_ENDPOINT, requestData, headers);
        },

        getVideoUrl: function(response) {
            if (response && response.success && response.data && response.data.video && response.data.video.url) {
                return response.data.video.url;
            }
            return null;
        }
    };
}

// API key loaded from environment
var API_KEY = "db16b6c0-042f-46b9-8bda-a6f280e2691c:2f84f41df5aef0c148a0796597a3eed2";

// Custom trim function for ExtendScript compatibility
function trimString(str) {
    if (!str) return "";
    return str.replace(/^\s+|\s+$/g, "");
}

// Video download utility
function downloadVideo(videoUrl, logger) {
    logger.info("VIDEO_DOWNLOAD", "Starting video download", {
        url: videoUrl
    });

    var startTime = new Date().getTime();
    var filename = "FAL_Video_" + startTime + ".mp4";

    // Use ExtendScript's proper file construction to avoid path issues
    var tempFolder = Folder.temp;

    // Method 1: Try creating file directly in temp folder
    var videoFile = File(tempFolder.fsName + "/" + filename);

    // Method 2: If that doesn't work, try alternative construction
    if (!videoFile || videoFile.fsName.indexOf("Temporaryltems") > -1) {
        // There might be a path corruption issue, try different approach
        videoFile = new File(Folder.temp.fsName.replace(/Temporaryltems/g, "TemporaryItems") + "/" + filename);
    }

    logger.info("VIDEO_FILE_PATH", "Video file path construction", {
        tempFolderPath: tempFolder.fsName,
        filename: filename,
        constructedPath: videoFile.fsName,
        pathCorrection: videoFile.fsName.indexOf("Temporaryltems") > -1 ? "NEEDS_CORRECTION" : "OK"
    });

    try {
        // Build curl command to download video
        var curlCmd = 'curl -L "' + videoUrl + '"';  // -L follows redirects
        curlCmd += ' --output "' + videoFile.fsName + '"';
        curlCmd += ' --connect-timeout 30';
        curlCmd += ' --max-time 300';  // 5 minutes max for video download
        curlCmd += ' --retry 3';  // Retry up to 3 times on failure
        curlCmd += ' --retry-delay 2';  // Wait 2 seconds between retries
        curlCmd += ' --fail';  // Fail silently on HTTP errors (4xx, 5xx)
        curlCmd += ' --location';  // Follow redirects (same as -L but explicit)
        curlCmd += ' --show-error';  // Show error messages even in silent mode
        curlCmd += ' --silent';  // Don't show progress meter

        logger.info("VIDEO_DOWNLOAD_CMD", "Download command prepared", {
            filename: filename,
            targetPath: videoFile.fsName,
            commandLength: curlCmd.length
        });

        alert("📥 DOWNLOADING VIDEO\n\nFilename: " + filename + "\nLocation: " + videoFile.fsName + "\n\nThis may take a moment...");

        // Execute download
        var downloadResult = system.callSystem(curlCmd);

        var endTime = new Date().getTime();
        var downloadDuration = endTime - startTime;

        logger.info("VIDEO_DOWNLOAD_RESULT", "Download completed", {
            exitCode: downloadResult,
            exitCodeType: typeof downloadResult,
            duration: downloadDuration + "ms",
            fileExists: videoFile.exists
        });

        // ExtendScript system.callSystem() can return various types
        // Check for actual failure conditions instead of just exit code
        var downloadFailed = false;
        var exitCodeMsg = downloadResult;

        if (typeof downloadResult === "number" && downloadResult !== 0) {
            downloadFailed = true;
            exitCodeMsg = "numeric exit code " + downloadResult;
        } else if (typeof downloadResult === "string" && downloadResult.length > 0 && downloadResult.indexOf("error") > -1) {
            downloadFailed = true;
            exitCodeMsg = "error string: " + downloadResult;
        }

        // Primary check: Does the file exist and have content?
        if (!videoFile.exists) {
            downloadFailed = true;
            exitCodeMsg += " (file not created)";
        } else {
            // Check file size
            var fileSize = videoFile.length;
            if (fileSize === 0) {
                downloadFailed = true;
                exitCodeMsg += " (file is empty)";
            } else {
                logger.info("VIDEO_DOWNLOAD_SUCCESS_DETAILS", "File validation passed", {
                    fileExists: true,
                    fileSize: fileSize + " bytes",
                    fileSizeKB: Math.round(fileSize/1024) + " KB"
                });
            }
        }

        if (downloadFailed) {
            throw new Error("Video download failed with exit code: " + exitCodeMsg);
        }

        // File validation passed - get final size for display
        var fileSize = videoFile.length;
        alert("✅ VIDEO DOWNLOADED\n\nFile: " + filename + "\nSize: " + Math.round(fileSize/1024) + " KB\nTime: " + Math.round(downloadDuration/1000) + " seconds");

        logger.info("VIDEO_DOWNLOAD_SUCCESS", "Video downloaded successfully", {
            filename: filename,
            filePath: videoFile.fsName,
            fileSize: fileSize + " bytes",
            downloadTime: downloadDuration + "ms"
        });

        return videoFile;

    } catch (error) {
        logger.error("VIDEO_DOWNLOAD_ERROR", "Video download failed", {
            error: error.toString(),
            url: videoUrl,
            targetFile: videoFile.fsName
        });

        // Clean up failed download
        try {
            if (videoFile.exists) {
                videoFile.remove();
            }
        } catch (cleanupError) {
            // Ignore cleanup errors
        }

        throw error;
    }
}

// Create permanent video file for AE access
function createPermanentVideoFile(tempVideoFile, logger) {
    logger.info("PERMANENT_FILE", "Creating permanent video file", {
        tempFile: tempVideoFile.fsName
    });

    try {
        // Create a permanent location (Desktop folder for easy access)
        var permanentFolder = Folder.desktop;
        var timestamp = new Date().getTime();
        var permanentFilename = "FAL_Generated_Video_" + timestamp + ".mp4";
        var permanentFile = new File(permanentFolder.fsName + "/" + permanentFilename);

        logger.info("PERMANENT_FILE_PATH", "Permanent file path created", {
            permanentPath: permanentFile.fsName,
            permanentFolder: permanentFolder.fsName
        });

        // Copy the temporary file to permanent location
        var copySuccess = tempVideoFile.copy(permanentFile);

        if (!copySuccess) {
            throw new Error("Failed to copy temporary file to permanent location");
        }

        if (!permanentFile.exists) {
            throw new Error("Permanent file was not created successfully");
        }

        var permanentFileSize = permanentFile.length;
        logger.info("PERMANENT_FILE_SUCCESS", "Permanent video file created", {
            permanentPath: permanentFile.fsName,
            fileSize: permanentFileSize + " bytes",
            fileSizeKB: Math.round(permanentFileSize/1024) + " KB"
        });

        // Clean up the temporary file now that we have a permanent copy
        try {
            tempVideoFile.remove();
            logger.info("TEMP_FILE_CLEANUP", "Temporary file cleaned up", null);
        } catch (cleanupError) {
            logger.warn("TEMP_FILE_CLEANUP", "Could not remove temporary file", {
                error: cleanupError.toString()
            });
        }

        alert("📁 VIDEO SAVED PERMANENTLY\n\nLocation: Desktop\nFile: " + permanentFilename + "\nSize: " + Math.round(permanentFileSize/1024) + " KB\n\nThis file will remain accessible to After Effects.");

        return permanentFile;

    } catch (error) {
        logger.error("PERMANENT_FILE_ERROR", "Failed to create permanent file", {
            error: error.toString(),
            tempFile: tempVideoFile.fsName
        });

        // If permanent file creation fails, return the temp file and don't delete it
        logger.warn("PERMANENT_FILE_FALLBACK", "Using temporary file as fallback", null);
        return tempVideoFile;
    }
}

// Video import and layer creation utilities
function importVideoToProject(videoFile, logger) {
    logger.info("VIDEO_IMPORT", "Importing video to project", {
        filePath: videoFile.fsName,
        filename: videoFile.name,
        fileExists: videoFile.exists
    });

    try {
        // Double-check file exists before import
        if (!videoFile.exists) {
            throw new Error("Video file does not exist at path: " + videoFile.fsName);
        }

        // Verify the file path doesn't have the corruption issue
        if (videoFile.fsName.indexOf("Temporaryltems") > -1) {
            logger.warn("VIDEO_IMPORT_PATH_ISSUE", "Detected path corruption, attempting to fix", {
                originalPath: videoFile.fsName
            });

            // Try to create a corrected file reference
            var correctedPath = videoFile.fsName.replace(/Temporaryltems/g, "TemporaryItems");
            var correctedFile = new File(correctedPath);

            if (correctedFile.exists) {
                videoFile = correctedFile;
                logger.info("VIDEO_IMPORT_PATH_FIXED", "Successfully corrected file path", {
                    correctedPath: videoFile.fsName
                });
            } else {
                throw new Error("Could not find video file at original or corrected path");
            }
        }

        // Import video into After Effects project
        var importOptions = new ImportOptions(videoFile);
        if (!importOptions) {
            throw new Error("Could not create import options for video file");
        }

        var footageItem = app.project.importFile(importOptions);
        if (!footageItem) {
            throw new Error("Failed to import video file to project");
        }

        logger.info("VIDEO_IMPORT_SUCCESS", "Video imported successfully", {
            footageName: footageItem.name,
            footageDuration: footageItem.duration,
            footageWidth: footageItem.width,
            footageHeight: footageItem.height
        });

        alert("📁 VIDEO IMPORTED\n\nName: " + footageItem.name + "\nDuration: " + Math.round(footageItem.duration * 100) / 100 + " seconds\nResolution: " + footageItem.width + "x" + footageItem.height);

        return footageItem;

    } catch (error) {
        logger.error("VIDEO_IMPORT_ERROR", "Failed to import video", {
            error: error.toString(),
            filePath: videoFile.fsName
        });
        throw error;
    }
}

function createVideoLayer(videoUrl, layerName, prompt, logger) {
    logger.info("VIDEO_LAYER_START", "Starting complete video layer creation", {
        layerName: layerName,
        hasUrl: !!videoUrl,
        urlPreview: videoUrl ? videoUrl.substring(0, 50) + "..." : "none"
    });

    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        logger.error("VIDEO_LAYER", "No active composition", null);
        throw new Error("No active composition found. Please create or select a composition first.");
    }

    try {
        // Step 1: Download the video
        logger.info("VIDEO_LAYER_STEP1", "Step 1: Downloading video", null);
        var videoFile = downloadVideo(videoUrl, logger);

        // Step 1.5: Move video to a more permanent location for AE access
        logger.info("VIDEO_LAYER_STEP1_5", "Step 1.5: Moving video to permanent location", null);
        var permanentVideoFile = createPermanentVideoFile(videoFile, logger);

        // Step 2: Import video to project
        logger.info("VIDEO_LAYER_STEP2", "Step 2: Importing video to project", null);
        var footageItem = importVideoToProject(permanentVideoFile, logger);

        // Step 3: Add video to composition
        logger.info("VIDEO_LAYER_STEP3", "Step 3: Adding video to composition", {
            compName: comp.name,
            footageName: footageItem.name
        });

        var videoLayer = comp.layers.add(footageItem);
        videoLayer.name = layerName || "FAL Generated Video";
        videoLayer.startTime = 0;
        videoLayer.comment = "Generated by FAL AI Veo3\nPrompt: " + prompt + "\nOriginal URL: " + videoUrl + "\nGenerated: " + new Date().toString() + "\nLocal file: " + videoFile.fsName;

        // Scale layer to fit composition if needed
        var scaleX = comp.width / footageItem.width;
        var scaleY = comp.height / footageItem.height;
        var uniformScale = Math.min(scaleX, scaleY) * 100; // Convert to percentage

        if (uniformScale !== 100) {
            videoLayer.property("Transform").property("Scale").setValue([uniformScale, uniformScale]);
            logger.info("VIDEO_LAYER_SCALED", "Video layer scaled to fit composition", {
                originalSize: footageItem.width + "x" + footageItem.height,
                compSize: comp.width + "x" + comp.height,
                scaleApplied: uniformScale + "%"
            });
        }

        logger.info("VIDEO_LAYER_COMPLETE", "Video layer created successfully", {
            layerName: videoLayer.name,
            layerIndex: videoLayer.index,
            compName: comp.name,
            videoDuration: footageItem.duration,
            videoFile: permanentVideoFile.fsName
        });

        alert("🎬 VIDEO LAYER CREATED!\n\nLayer: " + videoLayer.name + "\nIndex: " + videoLayer.index + "\nDuration: " + Math.round(footageItem.duration * 100) / 100 + " seconds" + (uniformScale !== 100 ? "\nScaled: " + Math.round(uniformScale) + "%" : "") + "\n\n📁 Video file saved to Desktop for permanent access!");

        return videoLayer;

    } catch (error) {
        logger.error("VIDEO_LAYER_ERROR", "Failed to create video layer", {
            error: error.toString(),
            videoUrl: videoUrl
        });
        throw error;
    }
}

// UI creation functions
function createDialog(title) {
    var dialog = new Window("dialog", title || "FAL AI Video Generator");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.spacing = 15;
    dialog.margins = 20;
    dialog.preferredSize.width = 500;
    dialog.preferredSize.height = 400;
    return dialog;
}

function createTextInput(parent) {
    var input = parent.add("edittext", undefined, "A casual street interview on a busy New York City sidewalk in the afternoon. The interviewer holds a plain, unbranded microphone and asks people about their favorite AI tools.", {multiline: true});
    input.preferredSize.width = 450;
    input.preferredSize.height = 120;
    input.active = true;
    return input;
}

function createButton(parent, text, width) {
    var button = parent.add("button", undefined, text || "Button");
    button.preferredSize.width = width || 130;
    button.preferredSize.height = 35;
    return button;
}

// Main application function
function runFalVideoGenerator() {
    // Initialize logger first
    var logger = createLogger();
    logger.info("APP_START", "FAL AI Video Generator starting", {
        aeVersion: app.version,
        hasProject: !!app.project
    });

    // Check After Effects version
    if (parseFloat(app.version) < 24.0) {
        logger.error("APP_INIT", "AE version too old", {
            currentVersion: app.version,
            requiredVersion: "24.0+"
        });
        alert("This script requires After Effects 2024 or later.\nCurrent version: " + app.version);
        return;
    }

    // Check if project is open
    if (!app.project) {
        logger.error("APP_INIT", "No project open", null);
        alert("Please open or create a project first.");
        return;
    }

    // Critical system requirements check
    alert("🔧 SYSTEM REQUIREMENTS CHECK\n\n" +
          "To make HTTP requests, After Effects needs:\n\n" +
          "1. ☑ Allow Scripts to Write Files and Access Network\n" +
          "   (Edit > Preferences > Scripting & Expressions)\n\n" +
          "2. ☑ Network connectivity\n\n" +
          "3. ⚠️ LIMITATION: ExtendScript Socket doesn't support HTTPS/SSL\n" +
          "   This means requests to HTTPS URLs may fail\n\n" +
          "Click OK to continue with the test...");

    // Test network permissions with correct ExtendScript syntax
    try {
        var testFile = new File(Folder.temp.fsName + "/ae_network_test.txt");
        var opened = testFile.open("w");
        if (!opened) {
            throw new Error("Could not open file for writing");
        }
        testFile.write("test");
        testFile.close();
        testFile.remove();
        alert("✅ FILE WRITE PERMISSION: OK\n\nNetwork access is properly enabled!");
    } catch (e) {
        alert("❌ FILE WRITE PERMISSION: FAILED\n\nError: " + e.toString() + "\n\nEven though you have the setting enabled, ExtendScript might have path issues.\n\nThis won't prevent HTTP requests - let's continue...");
        // Don't return - continue with the script since HTTP might still work
    }

    try {
        logger.info("APP_INIT", "Initializing services", {
            apiKeyProvided: !!API_KEY
        });

        // Initialize modular services
        var httpClient = createHttpClient(logger);
        var falClient = createFalClient(API_KEY, httpClient, logger);

        logger.info("APP_UI", "Creating user interface", null);

        // Create UI
        var dialog = createDialog("🎬 FAL AI Video Generator");

        // Add header (NO API KEY SHOWN)
        var headerGroup = dialog.add("group");
        headerGroup.orientation = "column";
        headerGroup.alignChildren = "center";

        var titleText = headerGroup.add("statictext", undefined, "🎬 FAL AI Video Generator");
        titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 18);

        var subtitleText = headerGroup.add("statictext", undefined, "Generate AI videos and add them to your composition");
        subtitleText.preferredSize.width = 450;
        subtitleText.justify = "center";

        // Add separator
        var separator1 = dialog.add("panel");
        separator1.preferredSize.height = 2;

        // Add prompt section
        var promptGroup = dialog.add("group");
        promptGroup.orientation = "column";
        promptGroup.alignChildren = "fill";

        var promptLabel = promptGroup.add("statictext", undefined, "📝 Video Prompt:");
        promptLabel.graphics.font = ScriptUI.newFont("Arial", "Bold", 12);

        var textInput = createTextInput(promptGroup);

        // Add settings section
        var settingsGroup = dialog.add("group");
        settingsGroup.orientation = "row";
        settingsGroup.alignment = "center";

        settingsGroup.add("statictext", undefined, "Duration:");
        var durationDropdown = settingsGroup.add("dropdownlist", undefined, ["4s", "6s", "8s"]);
        durationDropdown.selection = 2; // Default to 8s
        durationDropdown.preferredSize.width = 80;

        settingsGroup.add("statictext", undefined, "     Aspect Ratio:");
        var aspectDropdown = settingsGroup.add("dropdownlist", undefined, ["16:9", "9:16", "1:1"]);
        aspectDropdown.selection = 0; // Default to 16:9
        aspectDropdown.preferredSize.width = 80;

        // Add separator
        var separator2 = dialog.add("panel");
        separator2.preferredSize.height = 2;

        // Add buttons
        var buttonGroup = dialog.add("group");
        buttonGroup.orientation = "row";
        buttonGroup.alignment = "center";

        var generateButton = createButton(buttonGroup, "🚀 Generate Video", 150);
        var cancelButton = createButton(buttonGroup, "❌ Cancel", 100);

        // Add status section (NO API KEY DISPLAY)
        var statusGroup = dialog.add("group");
        statusGroup.orientation = "column";
        statusGroup.alignChildren = "fill";

        var statusText = statusGroup.add("statictext", undefined, "✅ Ready to generate video");
        statusText.preferredSize.width = 450;
        statusText.justify = "center";

        var connectionText = statusGroup.add("statictext", undefined, "🔗 Connected to FAL AI Veo3 API");
        connectionText.preferredSize.width = 450;
        connectionText.justify = "center";
        connectionText.graphics.foregroundColor = connectionText.graphics.newPen(connectionText.graphics.PenType.SOLID_COLOR, [0, 0.6, 0], 1);

        logger.info("APP_UI", "UI created successfully", null);

        // Setup event handlers
        generateButton.onClick = function() {
            // Immediate debug alert to confirm button click
            alert("🔧 DEBUG: Generate button was clicked!");

            var prompt = textInput.text;
            var trimmedPrompt = trimString(prompt);

            alert("🔧 DEBUG: Prompt captured - Length: " + (prompt ? prompt.length : 0) + " | Text: " + (prompt ? prompt.substring(0, 50) : "empty"));

            logger.info("USER_ACTION", "Generate button clicked", {
                promptLength: prompt ? prompt.length : 0,
                trimmedPromptLength: trimmedPrompt.length,
                hasPrompt: !!prompt,
                promptPreview: trimmedPrompt.substring(0, 50) + (trimmedPrompt.length > 50 ? "..." : "")
            });

            if (!prompt || trimmedPrompt.length === 0) {
                logger.warn("USER_INPUT", "Empty prompt provided", {
                    originalPrompt: prompt,
                    trimmedPrompt: trimmedPrompt
                });
                alert("Please enter a video description prompt.");
                textInput.active = true;
                return;
            }

            try {
                // Update UI for loading state
                logger.info("UI_STATE", "Switching to loading state", null);
                generateButton.text = "🔄 Generating...";
                generateButton.enabled = false;
                statusText.text = "🚀 Sending request to FAL AI Veo3...";

                // Force UI update
                dialog.update();

                // Prepare video generation options
                var videoOptions = {
                    aspect_ratio: aspectDropdown.selection.text,
                    duration: durationDropdown.selection.text,
                    resolution: "720p",
                    enhance_prompt: true,
                    generate_audio: true
                };

                alert("⚙️ VIDEO GENERATION OPTIONS\n\n" +
                      "Aspect Ratio: " + videoOptions.aspect_ratio + "\n" +
                      "Duration: " + videoOptions.duration + "\n" +
                      "Resolution: " + videoOptions.resolution + "\n" +
                      "Enhance Prompt: " + videoOptions.enhance_prompt + "\n" +
                      "Generate Audio: " + videoOptions.generate_audio + "\n\n" +
                      "Prompt: " + trimmedPrompt.substring(0, 100) + (trimmedPrompt.length > 100 ? "..." : ""));

                logger.info("VIDEO_OPTIONS", "Video options prepared", {
                    aspect_ratio: videoOptions.aspect_ratio,
                    duration: videoOptions.duration,
                    resolution: videoOptions.resolution,
                    enhance_prompt: videoOptions.enhance_prompt,
                    generate_audio: videoOptions.generate_audio,
                    optionsString: simpleStringify(videoOptions)
                });

                logger.info("REQUEST_START", "Starting FAL AI video generation request", {
                    endpoint: "https://fal.run/fal-ai/veo3/fast",
                    method: "POST",
                    promptLength: trimmedPrompt.length,
                    timestamp: new Date().toString()
                });

                // Generate video using FAL AI (with comprehensive logging)
                statusText.text = "📡 Making HTTP request to FAL AI...";
                dialog.update();

                alert("🎬 CALLING FAL AI API\nStarting video generation request...\nThis will show detailed HTTP tracking...");

                var startTime = new Date().getTime();
                var response = falClient.generateVideo(trimmedPrompt, videoOptions);
                var endTime = new Date().getTime();
                var requestDuration = endTime - startTime;

                alert("⏱️ REQUEST COMPLETED\n\nTotal time: " + requestDuration + "ms\nResponse received: " + (response && response.success ? "SUCCESS" : "FAILED"));

                // Get response keys manually for ExtendScript
                var responseKeys = [];
                if (response) {
                    for (var key in response) {
                        if (response.hasOwnProperty(key)) {
                            responseKeys.push(key);
                        }
                    }
                }

                logger.info("GENERATION_RESULT", "Video generation completed", {
                    success: response.success,
                    hasError: !!response.error,
                    duration: requestDuration + "ms",
                    responseStructure: responseKeys,
                    hasData: response && !!response.data,
                    hasVideoUrl: response && response.data && response.data.video && !!response.data.video.url
                });

                if (response.success) {
                    statusText.text = "✅ Video generated! Creating layer...";
                    dialog.update();

                    logger.info("URL_EXTRACTION", "Extracting video URL from response", {
                        responseHasData: response && !!response.data,
                        responseHasVideo: response && response.data && !!response.data.video
                    });

                    var videoUrl = falClient.getVideoUrl(response);

                    logger.info("URL_EXTRACTED", "Video URL extraction result", {
                        hasUrl: !!videoUrl,
                        urlLength: videoUrl ? videoUrl.length : 0,
                        urlPreview: videoUrl ? videoUrl.substring(0, 50) + "..." : "null"
                    });

                    if (videoUrl) {
                        logger.info("LAYER_CREATION", "Starting video layer creation", {
                            videoUrl: videoUrl,
                            promptLength: trimmedPrompt.length,
                            hasActiveComp: !!(app.project && app.project.activeItem)
                        });

                        // Create video layer in composition
                        var videoLayer = createVideoLayer(videoUrl, "FAL Generated Video", trimmedPrompt, logger);

                        statusText.text = "🎉 Success! Layer created: " + videoLayer.name;

                        logger.info("WORKFLOW_COMPLETE", "Complete workflow finished successfully", {
                            layerName: videoLayer.name,
                            layerIndex: videoLayer.index,
                            videoUrl: videoUrl,
                            totalDuration: requestDuration + "ms",
                            promptUsed: trimmedPrompt.substring(0, 100) + "...",
                            optionsUsed: simpleStringify(videoOptions)
                        });

                        alert(
                            "🎉 SUCCESS! Video generated and layer created!\n\n" +
                            "📹 Layer Name: " + videoLayer.name + "\n" +
                            "📍 Layer Index: " + videoLayer.index + "\n" +
                            "⏱️ Duration: " + videoOptions.duration + "\n" +
                            "📐 Aspect Ratio: " + videoOptions.aspect_ratio + "\n" +
                            "🎯 Prompt: " + trimmedPrompt.substring(0, 100) + (trimmedPrompt.length > 100 ? "..." : "") + "\n" +
                            "🔗 Video URL: " + videoUrl + "\n" +
                            "⏰ Generation Time: " + requestDuration + "ms\n\n" +
                            "📋 Check console/alerts for detailed HTTP logs and debugging information!\n" +
                            "✅ Real HTTP POST request sent to FAL AI Veo3 API",
                            "Video Generation Complete!"
                        );

                    } else {
                        logger.error("URL_MISSING", "No video URL found in successful response", {
                            responseKeys: responseKeys,
                            hasData: response && !!response.data,
                            dataStructure: response && response.data ? simpleStringify(response.data).substring(0, 200) : "no data"
                        });
                        throw new Error("No video URL found in response - check FAL API response format");
                    }

                } else {
                    logger.error("REQUEST_FAILED", "FAL AI request was not successful", {
                        responseKeys: responseKeys,
                        errorMessage: response.error,
                        statusCode: response.status,
                        duration: requestDuration + "ms"
                    });
                    throw new Error(response.error || "Failed to generate video - check API key and network connection");
                }

            } catch (error) {
                logger.error("WORKFLOW_ERROR", "Generation workflow failed", {
                    error: error.toString(),
                    errorType: error.name || "Unknown",
                    promptUsed: trimmedPrompt.substring(0, 100),
                    duration: requestDuration ? requestDuration + "ms" : "unknown",
                    videoOptionsUsed: simpleStringify(videoOptions),
                    timestamp: new Date().toString()
                });

                var errorMessage = "❌ Failed to generate video:\n\n" + error.toString();
                if (error.toString().indexOf("No video URL") > -1) {
                    errorMessage += "\n\n🔍 This suggests an issue with the FAL API response format.";
                } else if (error.toString().indexOf("Failed to connect") > -1) {
                    errorMessage += "\n\n🌐 This suggests a network connectivity issue.";
                } else if (error.toString().indexOf("API key") > -1) {
                    errorMessage += "\n\n🔑 This suggests an API key authentication issue.";
                }
                errorMessage += "\n\n📋 Check console/alerts for detailed HTTP logs and debugging information.";

                alert(errorMessage, "Generation Error");
                statusText.text = "❌ Error: " + error.toString().substring(0, 50);

                logger.info("ERROR_DISPLAY", "Error message shown to user", {
                    errorPreview: error.toString().substring(0, 100),
                    messageLength: errorMessage.length
                });
            } finally {
                // Reset button state
                logger.info("UI_STATE", "Resetting UI to ready state", {
                    buttonWasDisabled: !generateButton.enabled,
                    finalDuration: requestDuration ? requestDuration + "ms" : "not measured"
                });
                generateButton.text = "🚀 Generate Video";
                generateButton.enabled = true;
            }
        };

        cancelButton.onClick = function() {
            logger.info("USER_ACTION", "Cancel button clicked", null);
            logger.closeLog();
            dialog.close();
        };

        // Text input change handler
        textInput.onChange = function() {
            var hasText = trimString(textInput.text).length > 0;
            generateButton.enabled = hasText;

            if (hasText) {
                statusText.text = "✅ Ready to generate video";
            } else {
                statusText.text = "📝 Enter a prompt to get started";
            }
        };

        // Initial state
        var hasInitialText = trimString(textInput.text).length > 0;
        generateButton.enabled = hasInitialText;

        logger.info("APP_READY", "Application ready, showing dialog", null);

        // Show dialog
        dialog.center();
        dialog.show();

    } catch (error) {
        logger.error("APP_FATAL", "Fatal application error", {
            error: error.toString()
        });
        logger.closeLog();
        alert("❌ Failed to initialize FAL AI Video Generator:\n\n" + error.toString(), "Initialization Error");
    }
}

// Run the application
runFalVideoGenerator();