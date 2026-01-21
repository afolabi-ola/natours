/*eslint-disable */

import axios from 'axios';
import { showAlert } from './alert';

export async function updateUserSettings(data, type = 'data') {
  const url =
    type === 'password'
      ? '/api/v1/users/updateMyPassword'
      : '/api/v1/users/updateMe';

  try {
    const res = await axios.patch(url, data);

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully`);
      return true;
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
    return false;
  }
}
