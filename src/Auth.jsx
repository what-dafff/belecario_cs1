import axios from 'axios';

export const login = async (username, password) => {
  try {
    const response = await axios.post('http://localhost:5000/login', { username, password });
    localStorage.setItem('token', response.data.token);
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const getToken = () => {
  return localStorage.getItem("token");
};

const decodeBase64Url = (base64Url) => {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return atob(base64);
};

export const getCurrentUser = () => {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(token.split('.')[1]));
    return payload;
  } catch (error) {
    console.error("Token parsing error:", error);
    return null;
  }
};