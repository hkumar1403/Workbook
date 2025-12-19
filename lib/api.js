import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://workbook-gc93.onrender.com";

const api = axios.create({
  baseURL: API_BASE,
});

export default api;
