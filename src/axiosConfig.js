import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/',
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Token ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (
      error.response?.status === 403 &&
      error.response?.data?.redirect_url
    ) {
      localStorage.clear();
      sessionStorage.clear();

      globalThis.location.href = error.response.data.redirect_url;

      return new Promise(() => {});
    }

    return Promise.reject(error);
  }
);

export default api;
