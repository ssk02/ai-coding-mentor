import axios from "axios";

const API = axios.create({
  baseURL: "https://ai-coding-mentor-c5zq.onrender.com/api"
});

export const setAuthToken = (token) => {
  API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

export default API;
