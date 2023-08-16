// content.js

// Establish a connection with the background script
const port = chrome.runtime.connect({ name: "content-script" });

// Listen for navigation changes within the same tab
document.addEventListener('DOMContentLoaded', () => {
  const videoId = new URLSearchParams(window.location.search).get('v');
  if (videoId) {
    if (port && port.sender && port.sender.tab) {
      port.postMessage({ videoId });
    } else {
      console.log("Connection no longer exists.");
    }
  }
});

// Check if it's a YouTube video page
if (window.location.hostname === 'www.youtube.com' && window.location.pathname === '/watch') {
  // Extract video ID from the URL
  const videoId = new URLSearchParams(window.location.search).get('v');

  if (videoId) {
    chrome.runtime.sendMessage("Current page: Youtube.");
    // Send video ID to the background script
    port.postMessage({ videoId });
  }
}


