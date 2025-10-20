import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  withCredentials: true, // sends cookies automatically
});

// 1. Global flag to track if a refresh is currently in progress
let isRefreshing = false;
// 2. A queue of requests waiting for the token refresh to complete
let failedQueue = [];

// Function to process the queue with the new access token (or errors)
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      // Reject waiting requests if the refresh failed
      prom.reject(error);
    } else {
      // Resolve waiting requests, retrying the original call
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Auto-refresh when 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Check for 401 status and ensure it's not the already-retried request
    if (status === 401 && !originalRequest._retry) {
      
      originalRequest._retry = true; // Mark as retried
      
      // *** 1. If a refresh is NOT in progress, start one ***
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          // This will use refresh token cookie to get a new access token
          // The new access token will be set as a new cookie by the server
          await api.get("/auth/refresh"); 
          
          isRefreshing = false; 
          processQueue(null); // Process the queue, resolving with the successful refresh
          
          // Retry the single original failed request that initiated the refresh
          return api(originalRequest); 
        } catch (refreshError) {
          // If refresh fails, log out the user and reject all waiting promises
          isRefreshing = false;
          processQueue(refreshError);
          console.error("Refresh failed:", refreshError);
          window.location.href = "/auth/login";
          // Re-throw the error to ensure the initial promise chain is rejected
          return Promise.reject(refreshError); 
        }
      }

      // *** 2. If a refresh IS in progress, queue the request ***
      return new Promise((resolve, reject) => {
        // Add the request's resolve/reject functions to the queue
        failedQueue.push({ resolve, reject });
      })
      .then(() => {
        // When the refresh completes, this "then" block runs.
        // We now retry the original request.
        return api(originalRequest);
      })
      .catch((err) => {
        // If the refresh ultimately failed (caught in the try/catch block above)
        // the processQueue will reject this promise, propagating the error.
        return Promise.reject(err);
      });
    }

    // For any other error (non-401, or a 401 after the retry flag is set)
    return Promise.reject(error);
  }
);

export default api;