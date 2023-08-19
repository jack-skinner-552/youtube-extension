document.addEventListener('DOMContentLoaded', function () {
  const countdownElement = document.getElementById('countdown');

  function updateCountdownDisplay(remainingTime) {
    countdownElement.textContent = `Countdown: ${remainingTime} seconds remaining`;
  }

  // Get the remaining time from storage and update the display
  chrome.storage.local.get(['remainingTime'], function (result) {
    if (result.remainingTime !== undefined) {
      updateCountdownDisplay(result.remainingTime);
    }
    else if(result.remainingTime <= 0) {
      countdownElement.textContent = "Time has expired.";
    }
  });

  // Listen for changes in storage and update the display accordingly
  chrome.storage.onChanged.addListener(function (changes) {
    if (changes.remainingTime !== undefined) {
      updateCountdownDisplay(changes.remainingTime.newValue);
    }
  });
});
