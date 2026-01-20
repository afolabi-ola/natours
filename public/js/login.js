/*eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

export async function login(email, password) {
  try {
    const res = await axios.post('http://127.0.0.1:8000/api/v1/users/login', {
      email,
      password,
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
}

export async function logout() {
  try {
    const res = await axios.get('http://127.0.0.1:8000/api/v1/users/logout');

    if (res.data.status === 'success') {
      showAlert('success', 'Logout successfully');
      setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
}
