/*eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async (tourId) => {
  try {
    const session = await axios.get(
      `http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`,
    );

    window.location.replace(session.data.session.url);
  } catch (err) {
    console.log(err);
    showAlert('error', err.response.data.message);
  }
};
