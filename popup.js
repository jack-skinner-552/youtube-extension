document.addEventListener('DOMContentLoaded', function () {
  const countdownElement = document.getElementById('countdown');
  const categoriesHeader = document.querySelector('.categoriesHeader');
  const categoriesElement = document.getElementById('categories');
  const tagsHeader = document.querySelector('.tagsHeader');
  const tagsElement = document.getElementById('tags');
  const body = document.body;

  // Load data from storage and update the display
  chrome.storage.local.get(['remainingTime', 'categoryNames', 'tags'], function (result) {
    // Update countdown display
    if (result.remainingTime !== undefined) {
      updateCountdownDisplay(result.remainingTime);
    }
    
    // Update categories display
    if (result.categoryNames !== undefined) {
      updateCategoriesDisplay(result.categoryNames);
    }

    // Update tags display
    if (result.tags !== undefined) {
      updateTagsDisplay(result.tags);
    }
  });

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
      chrome.storage.local.get('blockedCategories', function (result) {
        const blockedCategories = result.blockedCategories || []; // Default to an empty array if not present
  
        const formattedCategoryNames = categoryNames.map(category => {
          if (blockedCategories.includes(category)) {
            return `<strong>${category}</strong>`;
          } else {
            return category;
          }
        });
  
        categoriesElement.innerHTML = formattedCategoryNames.join(', ');
        categoriesHeader.classList.remove('hidden');
      });
    } else {
      categoriesElement.textContent = "";
      categoriesHeader.classList.add('hidden');
    }
  }
  
  function updateTagsDisplay(tags) {
    if (tags && tags.length > 0) {
      chrome.storage.local.get('blockedTags', function (result) {
        const blockedTags = result.blockedTags || []; // Default to an empty array if not present
  
        const formattedTags = tags.map(tag => {
          if (blockedTags.includes(tag)) {
            return `<strong>${tag}</strong>`;
          } else {
            return tag;
          }
        });
  
        tagsElement.innerHTML = formattedTags.join(', ');
        tagsHeader.classList.remove('hidden');
      });
    } else {
      tagsElement.textContent = "";
      tagsHeader.classList.add('hidden');
    }
  }

  function updateWidth() {
    if (body.scrollHeight > window.innerHeight) {
      body.classList.add('wider');
    } else {
      body.classList.remove('wider');
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

  // Call the function on initial load and on window resize
  updateWidth();
  window.addEventListener('resize', updateWidth);
});
