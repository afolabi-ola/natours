/*eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async (tourId, startDate) => {
  try {
    const session = await axios.get(
      `/api/v1/bookings/checkout-session/${tourId}?startDate=${startDate}`,
    );

    // window.location.replace(session.data.session.url);
  } catch (err) {
    console.log(err);
    showAlert('error', err.response.data.message);
  }
};
