// FAL AI Client with HTTP logging
// Single responsibility: Handle FAL AI API communication with detailed logging
function createFalClient(apiKey, httpClient, logger) {

    var FAL_ENDPOINT = "https://fal.run/fal-ai/veo3/fast";

    // Helper function for ExtendScript compatibility
    function getObjectKeys(obj) {
        var keys = [];
        if (obj) {
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
        }
        return keys;
    }

    function prepareHeaders() {
        return {
            "Authorization": "Key " + apiKey,
            "Content-Type": "application/json",
            "User-Agent": "AfterEffects-FAL-Client/1.0"
        };
    }

    function makeVideoRequest(prompt, options) {
        logger.info("FAL_CLIENT", "Preparing video generation request", {
            promptLength: prompt.length,
            options: options
        });

        options = options || {};

        var requestData = {
            prompt: prompt,
            aspect_ratio: options.aspect_ratio || "16:9",
            duration: options.duration || "8s",
            resolution: options.resolution || "720p",
            enhance_prompt: options.enhance_prompt !== false,
            auto_fix: options.auto_fix !== false,
            generate_audio: options.generate_audio !== false
        };

        if (options.negative_prompt) {
            requestData.negative_prompt = options.negative_prompt;
        }
        if (options.seed) {
            requestData.seed = options.seed;
        }

        logger.http("FAL_REQUEST", "Sending request to FAL AI", {
            endpoint: FAL_ENDPOINT,
            requestData: requestData,
            hasApiKey: !!apiKey
        });

        try {
            var headers = prepareHeaders();
            var response = httpClient.post(FAL_ENDPOINT, requestData, headers);

            logger.http("FAL_RESPONSE", "Received response from FAL AI", {
                success: response.success,
                status: response.status,
                duration: response.duration,
                hasVideoData: response.data && response.data.output && response.data.output.video
            });

            if (response.success) {
                logger.debug("FAL_RESPONSE_STRUCTURE", "Analyzing FAL API response structure", {
                    hasData: !!response.data,
                    dataKeys: response.data ? getObjectKeys(response.data) : [],
                    responsePreview: response.data ? JSON.stringify(response.data).substring(0, 200) : "empty"
                });

                // FAL API returns: { "video": { "url": "https://..." } }
                // Transform response to expected format
                var videoUrl = null;
                if (response.data && response.data.video && response.data.video.url) {
                    videoUrl = response.data.video.url;
                } else if (response.data && response.data.output && response.data.output.video && response.data.output.video.url) {
                    // Fallback for different response structure
                    videoUrl = response.data.output.video.url;
                }

                var transformedResponse = {
                    success: true,
                    data: {
                        video: {
                            url: videoUrl
                        }
                    },
                    request_id: response.data.request_id || response.data.id || "unknown",
                    logs: response.data.logs || [],
                    original_response: response.data
                };

                logger.info("FAL_SUCCESS", "Video generation successful", {
                    requestId: transformedResponse.request_id,
                    videoUrl: videoUrl,
                    videoUrlFound: !!videoUrl,
                    responseSize: JSON.stringify(response.data).length
                });

                return transformedResponse;
            } else {
                logger.error("FAL_ERROR", "FAL AI request failed", {
                    error: response.error,
                    status: response.status
                });

                return {
                    success: false,
                    error: response.error || "Unknown error from FAL AI"
                };
            }

        } catch (error) {
            logger.error("FAL_EXCEPTION", "Exception in FAL request", {
                error: error.toString(),
                prompt: prompt.substring(0, 50) + "..."
            });

            return {
                success: false,
                error: error.toString()
            };
        }
    }

    return {
        generateVideo: function(prompt, options) {
            logger.info("FAL_GENERATE", "Video generation initiated", {
                promptPreview: prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""),
                optionsProvided: !!options
            });

            if (!prompt || prompt.replace(/^\s+|\s+$/g, "").length === 0) {
                logger.error("FAL_VALIDATION", "Empty prompt provided", null);
                return {
                    success: false,
                    error: "Prompt is required"
                };
            }

            if (!apiKey || apiKey.length === 0) {
                logger.error("FAL_AUTH", "No API key provided", null);
                return {
                    success: false,
                    error: "API key is required"
                };
            }

            return makeVideoRequest(prompt, options);
        },

        getVideoUrl: function(response) {
            logger.debug("FAL_EXTRACT", "Extracting video URL from response", {
                hasResponse: !!response,
                responseSuccess: response ? response.success : false
            });

            if (response && response.success && response.data && response.data.video && response.data.video.url) {
                var url = response.data.video.url;
                logger.info("FAL_URL_EXTRACTED", "Video URL extracted successfully", {
                    url: url,
                    urlLength: url.length
                });
                return url;
            }

            // Get response structure manually for ExtendScript compatibility
            var responseStructure = null;
            if (response) {
                responseStructure = [];
                for (var key in response) {
                    if (response.hasOwnProperty(key)) {
                        responseStructure.push(key);
                    }
                }
            }

            logger.warn("FAL_NO_URL", "No video URL found in response", {
                responseStructure: responseStructure
            });
            return null;
        },

        isValidResponse: function(response) {
            var isValid = response && response.success && response.data && response.data.video && response.data.video.url;
            logger.debug("FAL_VALIDATE", "Response validation", {
                isValid: isValid,
                hasResponse: !!response,
                hasSuccess: response ? response.success : false,
                hasData: response ? !!response.data : false,
                hasVideo: response && response.data ? !!response.data.video : false
            });
            return isValid;
        }
    };
}