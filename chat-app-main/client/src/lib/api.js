// src/lib/api.js
import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL, // Make sure this is set in your .env
});
export default api;
