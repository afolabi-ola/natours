import { showAlert } from './alert';

// Toggles visibility states safely using DOM lookups
export function toggleEditState(reviewId) {
  const viewState = document.getElementById(`view-state-${reviewId}`);
  const editForm = document.getElementById(`edit-form-${reviewId}`);

  if (!viewState || !editForm) return;

  if (editForm.style.display === 'none') {
    viewState.style.display = 'none';
    editForm.style.display = 'flex';
  } else {
    viewState.style.display = 'block';
    editForm.style.display = 'none';
  }
}

// Asynchronously dispatches the updated PATCH values to Express API endpoint
export async function submitEditForm(reviewId) {
  const updatedRating = document.getElementById(
    `edit-rating-input-${reviewId}`,
  ).value;
  const updatedText = document.getElementById(
    `edit-text-input-${reviewId}`,
  ).value;

  try {
    const response = await fetch(`/api/v1/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: Number(updatedRating),
        review: updatedText,
      }),
    });

    const data = await response.json();

    if (data.status === 'success') {
      // 1. Instantly update standard view text
      document.getElementById(`text-display-${reviewId}`).innerText =
        data.data.review.review;

      // 2. Clear out and dynamically rebuild star ratings system inline
      const ratingContainer = document.getElementById(
        `rating-display-${reviewId}`,
      );
      ratingContainer.innerHTML = '';

      for (let star = 1; star <= 5; star++) {
        const isActive = data.data.review.rating >= star;
        ratingContainer.innerHTML += `
          <svg class="dashboard-review__star dashboard-review__star--${isActive ? 'active' : 'inactive'}">
            <use xlink:href="/img/icons.svg#icon-star"></use>
          </svg>
        `;
      }

      // 3. Close the editing interface drawer state smoothly
      toggleEditState(reviewId);
    } else {
      alert(data.message || 'Something went wrong while saving changes.');
    }
  } catch (err) {
    console.error(err);
    alert('Failed to save your review updates.');
  }
}

// Drops target content record container out of DOM pool structure
export async function deleteReview(reviewId) {
  if (
    !confirm(
      'Are you absolutely sure you want to permanently delete this review?',
    )
  )
    return;

  try {
    const response = await fetch(`/api/v1/reviews/${reviewId}`, {
      method: 'DELETE',
    });

    if (response.status === 204 || response.ok) {
      const reviewCard = document.getElementById(`review-card-${reviewId}`);
      if (!reviewCard) return;

      // Soft slide out animation transition
      reviewCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      reviewCard.style.opacity = '0';
      reviewCard.style.transform = 'scale(0.95)';

      setTimeout(() => {
        reviewCard.remove();

        // Dynamic zero check trigger window reload to fire off clean empty state block rendering layout
        const remainingCards = document.querySelectorAll(
          '.dashboard-review__card',
        );
        if (remainingCards.length === 0) {
          window.location.reload();
        }
      }, 300);
    } else {
      alert('Could not process this review deletion request.');
    }
  } catch (err) {
    console.error(err);
    alert('An unexpected error occurred during execution.');
  }
}

// Interacts dynamically with UI components to toggle highlighted stars layout styles
export function initStarsSystem() {
  const container = document.querySelector('.interactive-stars-rating');
  const ratingInput = document.getElementById('review-rating-value');
  if (!container || !ratingInput) return;

  const stars = Array.from(container.querySelectorAll('.interactive-star'));

  container.addEventListener('click', (e) => {
    const clickedStar = e.target.closest('.interactive-star');
    if (!clickedStar) return;

    const selectedValue = parseInt(clickedStar.dataset.star, 10);
    ratingInput.value = selectedValue;

    // Shift fill states based on numeric array index values
    stars.forEach((star, index) => {
      if (index < selectedValue) {
        star.classList.remove('interactive-star--dimmed');
      } else {
        star.classList.add('interactive-star--dimmed');
      }
    });
  });
}

// Dispatches asynchronous POST request payloads to create reviews
export async function createTourReview(tourId, reviewText, ratingValue) {
  try {
    const response = await fetch(`/api/v1/tours/${tourId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        review: reviewText,
        rating: Number(ratingValue),
      }),
    });

    const data = await response.json();

    if (data.status === 'success') {
      showAlert('success', 'Thank you! Your review was successfully added.', 5);

      // Soft page reload after short timeout to show the new review in the list
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      showAlert(
        'error',
        data.message || 'Could not process review submission.',
        5,
      );
    }
  } catch (err) {
    console.error(err);
    showAlert(
      'error',
      'An unexpected error occurred while posting your review.',
      5,
    );
  }
}
