document.addEventListener('DOMContentLoaded', function () {
    console.log(new Date().toLocaleTimeString(), "DOMContentLoaded event fired!");
    const saveButton = document.getElementById('saveButton');
    const statusText = document.getElementById('statusText');
    const categoriesCheckboxes = document.querySelectorAll('input[name="categories"]');
    const tagsTextarea = document.getElementById('tags');
  
    // Load options from storage and update UI
    chrome.storage.local.get(['blockedCategories', 'blockedTags'], function (result) {
      if (result.blockedCategories) {
        result.blockedCategories.forEach(category => {
          const checkbox = document.querySelector(`input[name="categories"][value="${category}"]`);
          if (checkbox) {
            checkbox.checked = true;
          }
        });
      }
      if (result.blockedTags) {
        tagsTextarea.value = result.blockedTags.join(', '); // Convert array to comma-separated string
      }
    });
  
    // Save options when the save button is clicked
    saveButton.addEventListener('click', function () {
      const selectedCategories = Array.from(categoriesCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
  
      const blockedTags = tagsTextarea.value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');
  
      chrome.storage.local.set({ blockedCategories: selectedCategories, blockedTags }, function () {
        console.log("New Blocked Categories:", selectedCategories);
        console.log("New Blocked Tags:", blockedTags);
        statusText.textContent = 'Options saved!';
        setTimeout(function () {
          statusText.textContent = '';
        }, 5000);
      });
      // Notify the background script about the updated options
      chrome.runtime.sendMessage({
        action: "updateOptions",
        blockedCategories: selectedCategories,
        blockedTags: blockedTags
      }, function (response) {
        console.log(response.message); // Optional: Log the response from the background script
      });
    });
  });
  