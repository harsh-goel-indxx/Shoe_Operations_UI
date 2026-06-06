import axios from "axios";

const apiClient = axios.create({
  // baseURL: "http://localhost:8000/api/",
  baseURL: "http://3.110.108.83:8000/api/",
  headers: { "Content-Type": "application/json" },
});

export default apiClient;