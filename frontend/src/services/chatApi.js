import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/chat";
const apiClient = axios.create({
  baseURL: API_URL.replace(/\/chat$/, ""),
});

const getErrorMessage = (error, fallbackMessage) => {
  return error?.response?.data?.error || fallbackMessage;
};

export const submitResearchQuery = async ({ context, message, sessionId }) => {
  try {
    const response = await apiClient.post("/chat", {
      context,
      message,
      sessionId,
    });

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Something went wrong while fetching research data.")
    );
  }
};

export const fetchSessionSnapshot = async (sessionId) => {
  try {
    const response = await apiClient.get(`/session/${encodeURIComponent(sessionId)}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load previous session."));
  }
};

export const fetchSessionSearches = async (sessionId) => {
  try {
    const response = await apiClient.get(
      `/session/${encodeURIComponent(sessionId)}/searches`
    );
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load search history."));
  }
};
