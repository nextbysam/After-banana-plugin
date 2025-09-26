// HTTP Client with comprehensive logging
// Single responsibility: Handle HTTP requests with detailed logging
function createHttpClient(logger) {

    // Initialize JSON utilities
    var jsonUtils = createJsonUtils();

    // URL parsing utility
    function parseUrl(url) {
        try {
            // Basic URL parsing for ExtendScript
            var protocol = "https";
            var host = "";
            var port = 443;
            var path = "/";

            // Remove protocol
            if (url.indexOf("://") > -1) {
                var parts = url.split("://");
                protocol = parts[0];
                url = parts[1];
            }

            // Extract path
            var slashIndex = url.indexOf("/");
            if (slashIndex > -1) {
                path = url.substring(slashIndex);
                host = url.substring(0, slashIndex);
            } else {
                host = url;
            }

            // Extract port
            var colonIndex = host.indexOf(":");
            if (colonIndex > -1) {
                port = parseInt(host.substring(colonIndex + 1));
                host = host.substring(0, colonIndex);
            } else {
                port = (protocol === "https") ? 443 : 80;
            }

            return {
                protocol: protocol,
                host: host,
                port: port,
                path: path
            };
        } catch (e) {
            return null;
        }
    }

    // Parse HTTP response
    function parseHttpResponse(rawResponse) {
        try {
            var lines = rawResponse.split("\r\n");
            var statusLine = lines[0];
            var statusParts = statusLine.split(" ");
            var status = parseInt(statusParts[1]);
            var statusText = statusParts.slice(2).join(" ");

            var headers = {};
            var bodyStartIndex = -1;

            // Parse headers
            for (var i = 1; i < lines.length; i++) {
                if (lines[i] === "") {
                    bodyStartIndex = i + 1;
                    break;
                }
                var headerLine = lines[i];
                var colonIndex = headerLine.indexOf(":");
                if (colonIndex > -1) {
                    var key = headerLine.substring(0, colonIndex).trim();
                    var value = headerLine.substring(colonIndex + 1).trim();
                    headers[key] = value;
                }
            }

            // Extract body
            var body = "";
            if (bodyStartIndex > -1) {
                body = lines.slice(bodyStartIndex).join("\r\n");
            }

            return {
                status: status,
                statusText: statusText,
                headers: headers,
                body: body
            };
        } catch (e) {
            return {
                status: 0,
                statusText: "Parse Error",
                headers: {},
                body: rawResponse
            };
        }
    }

    function makeHttpRequest(url, method, data, headers) {
        // Count headers manually for ExtendScript compatibility
        var headerCount = 0;
        if (headers) {
            for (var key in headers) {
                if (headers.hasOwnProperty(key)) {
                    headerCount++;
                }
            }
        }

        logger.http("HTTP_CLIENT", "Starting " + method + " request", {
            url: url,
            method: method,
            hasData: !!data,
            headerCount: headerCount
        });

        var startTime = new Date().getTime();

        try {
            // Parse URL to get host, path, and port
            var urlParts = parseUrl(url);
            if (!urlParts) {
                throw new Error("Invalid URL: " + url);
            }

            logger.info("HTTP_REQUEST", "Connecting to server", {
                host: urlParts.host,
                port: urlParts.port,
                path: urlParts.path,
                protocol: urlParts.protocol
            });

            // Create socket connection
            var socket = new Socket();
            var connected = socket.open(urlParts.host + ":" + urlParts.port, "BINARY");

            if (!connected) {
                throw new Error("Failed to connect to " + urlParts.host + ":" + urlParts.port);
            }

            // Prepare request body
            var requestBody = "";
            if (data && method === "POST") {
                requestBody = typeof data === "string" ? data : jsonUtils.stringify(data);
            }

            // Build HTTP request
            var httpRequest = method + " " + urlParts.path + " HTTP/1.1\r\n";
            httpRequest += "Host: " + urlParts.host + "\r\n";
            httpRequest += "User-Agent: AfterEffects-FAL-Client/1.0\r\n";
            httpRequest += "Connection: close\r\n";

            // Add custom headers
            if (headers) {
                for (var key in headers) {
                    if (headers.hasOwnProperty(key)) {
                        httpRequest += key + ": " + headers[key] + "\r\n";
                    }
                }
            }

            // Add content length for POST requests
            if (method === "POST" && requestBody) {
                httpRequest += "Content-Length: " + requestBody.length + "\r\n";
                logger.debug("HTTP_BODY", "POST request body prepared", {
                    bodyLength: requestBody.length,
                    bodyPreview: requestBody.substring(0, 200) + (requestBody.length > 200 ? "..." : "")
                });
            }

            httpRequest += "\r\n" + requestBody;

            logger.info("HTTP_SEND", "Sending HTTP request", {
                requestSize: httpRequest.length,
                hasBody: !!requestBody,
                headersIncluded: httpRequest.split("\r\n").length - 2
            });

            logger.debug("HTTP_REQUEST_FULL", "Complete HTTP request being sent", {
                requestHeaders: httpRequest.split("\r\n\r\n")[0],
                hasRequestBody: httpRequest.indexOf("\r\n\r\n") > -1
            });

            // Send request
            socket.write(httpRequest);

            // Read response
            var response = "";
            var chunk;
            while ((chunk = socket.read()) !== "") {
                if (chunk === null) break;
                response += chunk;
            }

            socket.close();

            var endTime = new Date().getTime();
            var duration = endTime - startTime;

            // Parse the HTTP response
            var parsedResponse = parseHttpResponse(response);

            logger.info("HTTP_RECEIVE", "Response received", {
                responseSize: response.length,
                duration: duration + "ms",
                status: parsedResponse.status,
                statusText: parsedResponse.statusText
            });

            logger.http("HTTP_COMPLETE", "Request completed", {
                status: parsedResponse.status,
                statusText: parsedResponse.statusText,
                duration: duration + "ms",
                responseLength: parsedResponse.body ? parsedResponse.body.length : 0
            });

            // Safe JSON parsing using utility
            var parsedData = null;
            if (parsedResponse.body && parsedResponse.body.length > 0) {
                parsedData = jsonUtils.safeParse(parsedResponse.body, {});
                if (parsedData === null) {
                    logger.error("HTTP_PARSE", "Failed to parse response JSON", {
                        bodyPreview: parsedResponse.body ? parsedResponse.body.substring(0, 100) : "empty"
                    });
                    parsedData = { parseError: "Invalid JSON response", rawBody: parsedResponse.body };
                }
            } else {
                parsedData = {};
            }

            return {
                success: parsedResponse.status >= 200 && parsedResponse.status < 300,
                status: parsedResponse.status,
                statusText: parsedResponse.statusText,
                headers: parsedResponse.headers,
                data: parsedData,
                duration: duration
            };

        } catch (error) {
            logger.error("HTTP_ERROR", "Request failed", {
                error: error.toString(),
                url: url,
                method: method
            });

            return {
                success: false,
                error: error.toString(),
                status: 0
            };
        }
    }

    return {
        post: function(url, data, headers) {
            headers = headers || {};
            headers["Content-Type"] = headers["Content-Type"] || "application/json";

            // Get data keys manually for ExtendScript compatibility
            var dataKeys = [];
            if (data) {
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        dataKeys.push(key);
                    }
                }
            }

            logger.info("HTTP_POST", "POST request initiated", {
                url: url,
                dataKeys: dataKeys
            });

            return makeHttpRequest(url, "POST", data, headers);
        },

        get: function(url, headers) {
            logger.info("HTTP_GET", "GET request initiated", {
                url: url
            });

            return makeHttpRequest(url, "GET", null, headers);
        }
    };
}