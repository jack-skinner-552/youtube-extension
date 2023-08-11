// Establish a connection with the background script
const port = chrome.runtime.connect({ name: "popup-script" });

// Function to fetch the remaining countdown time from the background script
async function getRemainingTime() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ getRemainingTime: true }, response => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (response && response.remainingTime !== undefined) {
        resolve(response.remainingTime);
      } else {
        reject(new Error("Countdown time not available."));
      }
    });
  });
}

// Function to format time as minutes and seconds
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Function to display the countdown in the popup
async function displayCountdown() {
  try {
    const remainingTime = await getRemainingTime();
    const countdownElement = document.getElementById('countdown');
    countdownElement.textContent = formatTime(remainingTime);

    if (remainingTime === 0) {
      countdownElement.textContent = "Time has expired";
    }
  } catch (error) {
    console.error('Error fetching countdown time:', error);
    const countdownElement = document.getElementById('countdown');
    countdownElement.textContent = 'Countdown time not available.';
  }
}

// Call the async function to display countdown when the popup is opened
document.addEventListener('DOMContentLoaded', async () => {
  const timestamp1 = new Date().toLocaleTimeString();
  console.log('popup opened', timestamp1);

  // Check if the countdown has expired in Chrome storage
  chrome.storage.local.get(['countdownExpired'], result => {
    console.log('Chrome isExpired:', result.countdownExpired);
    if (result.countdownExpired) {
      const countdownElement = document.getElementById('countdown');
      countdownElement.textContent = "Time has expired";
    } else {
      displayCountdown(); // Display the countdown
    }
  });
});


// Handle updates from the background script
port.onMessage.addListener(message => {
  console.log("Received message:", message);
  if (message.countdownValue !== undefined) {
    const countdownElement = document.getElementById('countdown');
    countdownElement.textContent = formatTime(message.countdownValue);
  }
  if (message.isCountdownExpired === true) {
    const countdownElement = document.getElementById('countdown');
    countdownElement.textContent = "Time has expired";
  }
});
