import axios from "axios";
import debugInterceptor from "../../utils/DebugInterceptor";

// Export a function to add a test log
export const addTestDebugLog = () => {
  debugInterceptor.addTestLog();
};

// Export a function to make test API calls
export const makeTestApiCalls = async () => {
  try {
    // Make some test API calls
    await axios.get(`${import.meta.env.VITE_API_URL}/health`).catch(() => {});
    await axios
      .post(`${import.meta.env.VITE_API_URL}/test`, { test: true })
      .catch(() => {});
  } catch (error) {
    console.error("Test API calls failed:", error);
  }
};
