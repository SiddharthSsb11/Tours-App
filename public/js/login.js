import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => 
{
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
        withCredentials: true //cors//fgc
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    if ((res.data.status = 'success')) {
        showAlert('success', 'Logged out successfully!');
        window.setTimeout(() => {
            location.assign('/');//window.location.replace//href('http://localhost:3000/')
        }, 1500); 
    }
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging out! Try again.');
  }
};