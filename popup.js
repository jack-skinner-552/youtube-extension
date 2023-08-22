document.addEventListener('DOMContentLoaded', function () {
  const countdownElement = document.getElementById('countdown');
  const categoriesHeader = document.querySelector('.categoriesHeader');
  const categoriesElement = document.getElementById('categories');
  const tagsHeader = document.querySelector('.tagsHeader');
  const tagsElement = document.getElementById('tags');

  function updateCountdownDisplay(remainingTime) {
    if (remainingTime > 0) {
      const hours = Math.floor(remainingTime / 3600);
      const minutes = Math.floor((remainingTime % 3600) / 60);
      const seconds = remainingTime % 60;
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      countdownElement.textContent = `Countdown: ${formattedTime} remaining`;
    } else if (remainingTime <= 0) {
      countdownElement.textContent = "Time has expired.";
    }
  }

  function updateCategoriesDisplay(categoryNames) {
    if (categoryNames && categoryNames.length > 0) {
      categoriesElement.textContent = `${categoryNames.join(', ')}`;
      categoriesHeader.classList.remove('hidden');
    } else {
      categoriesElement.textContent = ""; // Clear the content
      categoriesHeader.classList.add('hidden'); // Hide the header
    }
  }

  function updateTagsDisplay(tags) {
    if (tags && tags.length > 0) {
      tagsElement.textContent = `${tags.join(', ')}`;
      tagsHeader.classList.remove('hidden');
    } else {
      tagsElement.textContent = ""; // Clear the content
      tagsHeader.classList.add('hidden'); // Hide the header
    }
  }

  // Get the remaining time from storage and update the display
  chrome.storage.local.get(['remainingTime', 'categoryNames', 'tags'], function (result) {
    if (result.remainingTime !== undefined) {
      updateCountdownDisplay(result.remainingTime);
    }
    if (result.categoryNames !== undefined) {
      updateCategoriesDisplay(result.categoryNames);
    }
    if (result.tags !== undefined) {
      updateTagsDisplay(result.tags);
    }
  });

  // Listen for changes in storage and update the display accordingly
  chrome.storage.onChanged.addListener(function (changes) {
    if (changes.remainingTime !== undefined) {
      updateCountdownDisplay(changes.remainingTime.newValue);
    }
    if (changes.categoryNames !== undefined) {
      updateCategoriesDisplay(changes.categoryNames.newValue);
    }
    if (changes.tags !== undefined) {
      updateTagsDisplay(changes.tags.newValue);
    }
  });
});
