// background.js (Service Worker)

let storedCategoryNames = [];

function updateIcon(tabId, tabUrl) {
  if (tabUrl && tabUrl.includes('youtube.com')) {
    chrome.action.setIcon({ tabId, path: 'icon-128.png' });
  } else {
    chrome.action.setIcon({ tabId, path: 'icon-128-gray.png' });
  }
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    updateIcon(tabId, changeInfo.url);
  }
});

// Listen for tab activations
chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    updateIcon(tab.id, tab.url);
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (typeof message === 'string') {
    console.log('Received Message:', message);
  } else if (message.requestCategories) {
    sendResponse({ categoryNames: storedCategoryNames });
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.categoryNames) {
    storedCategoryNames = message.categoryNames;
    console.log('Video Categories:', storedCategoryNames);
  }
});