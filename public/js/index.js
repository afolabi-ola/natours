/*eslint-disable */

import { showAlert } from './alert';
import { displayMap } from './leaflet';
import { login, logout } from './login';
import { bookTour } from './stripe';
import { updateUserSettings } from './updateSettings';

const loginForm = document.querySelector('#form--login');
const loginEmailInput = document.querySelector('#form--login #email');
const loginPasswordInput = document.querySelector('#form--login #password');
const mapBox = document.getElementById('map');
const logoutBtn = document.getElementById('logout');

const accountForm = document.querySelector('.form-user-data');
const accountNameInput = document.querySelector('.form-user-data #name');
const accountEmailInput = document.querySelector('.form-user-data #email');
const accountPhotoInput = document.querySelector('#photo');

const passwordForm = document.querySelector('.form-user-password');
const currentPasswordInput = document.getElementById('password-current');
const newPasswordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('password-confirm');
const savePasswordBtn = document.querySelector('.btn--save-password');

const bookTourBtn = document.getElementById('book-tour');

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    login(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

if (accountForm) {
  accountForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', accountNameInput.value);
    form.append('email', accountEmailInput.value);
    form.append('photo', accountPhotoInput.files[0]);

    updateUserSettings(form);
  });
}

if (passwordForm) {
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    savePasswordBtn.textContent = 'Updating...';
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const passwordConfirm = confirmPasswordInput.value;
    const success = await updateUserSettings(
      { currentPassword, newPassword, passwordConfirm },
      'password',
    );

    savePasswordBtn.textContent = 'Save Password';

    if (success) {
      currentPasswordInput.value = '';
      newPasswordInput.value = '';
      confirmPasswordInput.value = '';
    }
  });
}

if (bookTourBtn)
  bookTourBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';

    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });

const alertMessage = document.querySelector('body').dataset.alert;

if (alertMessage) showAlert('success', alertMessage, 20);