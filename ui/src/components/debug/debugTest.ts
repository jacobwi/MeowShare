// Test file to ensure debug interceptor is working
import axios from "axios";
import debugInterceptor from "../../utils/DebugInterceptor";

/**
 * Helper function to make test API calls to populate debug logs
 */
export const makeTestApiCalls = async () => {
  // Ensure debug mode is enabled
  if (!debugInterceptor.isDebugEnabled()) {
    console.log("Enabling debug interceptor");
    debugInterceptor.setDebugModeCallback(() => true);
  }

  // Make a few test calls to different endpoints with different methods
  try {
    console.log("Making test API calls to populate debug logs");

    // GET request
    await axios
      .get("/api/health-check")
      .catch(() => console.log("Health check call completed (errors ignored)"));

    // POST request
    await axios
      .post("/api/test-endpoint", { test: "data" })
      .catch(() => console.log("Test POST completed (errors ignored)"));

    // PUT request
    await axios
      .put("/api/test-update", { id: 1, value: "updated" })
      .catch(() => console.log("Test PUT completed (errors ignored)"));

    console.log("Test API calls complete");
    console.log("Debug logs count:", debugInterceptor.getLogs().length);

    return true;
  } catch (error) {
    console.error("Error making test API calls:", error);
    return false;
  }
};

// Export the interceptor for direct access
export { debugInterceptor };
