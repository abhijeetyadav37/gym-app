import axios from "axios";

// One central place that knows your backend's address.
// During local dev it points to localhost; once deployed on Render,
// we'll switch this via an environment variable.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
});

// This runs before every request — it automatically attaches the
// logged-in user's token, so you never have to manually add it
// in every single API call across the app.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("gymAuthToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;