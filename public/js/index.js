/*eslint-disable */

import { showAlert } from './alert';
import { displayMap } from './leaflet';
import { login, logout, signUp } from './auth.js';
import { bookTour } from './stripe';
import { updateUserSettings } from './updateSettings';
import { searchTours } from './search.js';
import { submitEditForm, toggleEditState, deleteReview } from './review.js';
// ... [Keep your imported definitions from before unchanged]
import { initStarsSystem, createTourReview } from './review.js';


const signUpForm = document.querySelector('#form--signup');
const signUpBtn = document.querySelector('#signup-btn');
const signUpNameInput = document.querySelector('#form--signup #name');
const signUpEmailInput = document.querySelector('#form--signup #email');
const signUpPasswordInput = document.querySelector('#form--signup #password');
const signUpConfirmPasswordInput = document.querySelector(
  '#form--signup #confirmPassword',
);
const loginForm = document.querySelector('#form--login');
const loginBtn = document.querySelector('#login-btn');
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

const startDateSelector = document.getElementById('startDates');

const bookTourBtn = document.getElementById('book-tour');

// Initialize the interactive review star selector if it is visible on screen
if (document.querySelector('.interactive-stars-rating')) {
  initStarsSystem();
}

// Intercept Review Creation Submissions securely
const createReviewForm = document.getElementById('form--create-review');

//search
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (signUpForm) {
  signUpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (signUpBtn) signUpBtn.textContent = 'Signing up...';

    const name = signUpNameInput.value;
    const email = signUpEmailInput.value;
    const password = signUpPasswordInput.value;
    const passwordConfirm = signUpConfirmPasswordInput.value;
    signUp({ name, email, password, passwordConfirm });
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (loginBtn) loginBtn.textContent = 'Logging in...';

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
    console.log('clicked');
    e.target.textContent = 'Processing...';

    const { tourId } = e.target.dataset;
    bookTour(tourId, startDateSelector.value);
  });

const alertMessage = document.querySelector('body').dataset.alert;

if (alertMessage) showAlert('success', alertMessage, 20);

if (startDateSelector)
  startDateSelector.addEventListener('change', function (e) {
    if (this.value) {
      bookTourBtn.removeAttribute('disabled');
    }
  });

if (searchForm) {
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const searchValue = searchInput.value;

    if (searchValue) {
      searchTours(searchValue);
    }
  });
}

// ... [Keep your existing authentication, accountForm, and search listeners exactly as they are]

// CENTRALIZED EVENT DELEGATION SYSTEM FOR USER REVIEWS
const reviewsContainer = document.querySelector('.reviews__container');

if (reviewsContainer) {
  // Capture click events inside the container
  reviewsContainer.addEventListener('click', (e) => {
    // 1. Closest locator grabs target button or inside svg element nodes effortlessly
    const editBtn = e.target.closest('.dashboard-review__btn--edit');
    const deleteBtn = e.target.closest('.dashboard-review__btn--delete');
    const cancelBtn = e.target.closest('.dashboard-review__btn--cancel');

    if (editBtn) {
      const { reviewId } = editBtn.dataset;
      toggleEditState(reviewId);
    }

    if (deleteBtn) {
      const { reviewId } = deleteBtn.dataset;
      deleteReview(reviewId);
    }

    if (cancelBtn) {
      const { reviewId } = cancelBtn.dataset;
      toggleEditState(reviewId);
    }
  });

  // Capture submit hooks emitted by internal hidden form cards
  reviewsContainer.addEventListener('submit', (e) => {
    const editForm = e.target.closest('.dashboard-review__edit-form');

    if (editForm) {
      e.preventDefault();
      const { reviewId } = editForm.dataset;
      submitEditForm(reviewId);
    }
  });
}

if (createReviewForm) {
  createReviewForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('btn-submit-review');
    if (submitBtn) {
      submitBtn.textContent = 'Submitting...';
      submitBtn.setAttribute('disabled', 'true');
    }

    const { tourId } = createReviewForm.dataset;
    const reviewText = document.getElementById('review-text-input').value;
    const ratingValue = document.getElementById('review-rating-value').value;

    createTourReview(tourId, reviewText, ratingValue);
  });
}
