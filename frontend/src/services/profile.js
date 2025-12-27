import API from '../services/api'
import axios from "axios";

// create the profile id fetcher
export const retrieveProfile = () => API.get(`api/profile/me/`);
export const updateProfile = (id, data) => API.patch(`api/profile/me/`, data);

export const changePassword = async (passwordData) => {
  const token = localStorage.getItem('token') ||
                localStorage.getItem('authToken') ||
                localStorage.getItem('access');

  try {
    const response = await axios.post(
      'http://127.0.0.1:8000/auth/password/change/',
      {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      },
      {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};