// background.js

// Get the URL of the apiKey.txt file in the extension's directory
const apiKeyFileURL = chrome.runtime.getURL('apiKey.txt');
let apiKey = "";

// Fetch the content of the apiKey.txt file
fetch(apiKeyFileURL)
  .then(response => response.text())
  .then(apiKeyText => {
    // Trim any extra spaces or newlines from the apiKey
    apiKey = apiKeyText.trim();

    // Use the apiKey in your extension logic
    console.log('API Key:', apiKey);

    // Now you can use the apiKey in your extension logic
    // For example, you might use it to make API requests

    // Start listening for messages and other actions here
  })
  .catch(error => {
    console.error('Error reading apiKey.txt:', error);
  });

let originalCountdownTime = 60 * 60; // 1 hour  // Adjust the countdown as needed
let remainingTime = 60 * 60; 
chrome.storage.local.set({ remainingTime });
let blockedCategories = ["Film & Animation", "Gaming", "News & Politics", "Shows", "Movies"];
let blockedTags = ["tears of the kingdom", "Transformers"];
let countdownInterval = null;
let activeTabId;
let videoID;
let categoryNames = null;
let countdownActive = false;
let tags = null;

function getCategoryNames(categories) {
    const categoryMapping = {
      "1": "Film & Animation",
      "2": "Autos & Vehicles",
      "10": "Music",
      "15": "Pets & Animals",
      "17": "Sports",
      "18": "Short Movies",
      "19": "Travel & Events",
      "20": "Gaming",
      "21": "Videoblogging",
      "22": "People & Blogs",
      "23": "Comedy",
      "24": "Entertainment",
      "25": "News & Politics",
      "26": "Howto & Style",
      "27": "Education",
      "28": "Science & Technology",
      "29": "Nonprofits & Activism",
      "30": "Movies",
      "31": "Anime/Animation",
      "32": "Action/Adventure",
      "33": "Classics",
      "34": "Comedy",
      "35": "Documentary",
      "36": "Drama",
      "37": "Family",
      "38": "Foreign",
      "39": "Horror",
      "40": "Sci-Fi/Fantasy",
      "41": "Thriller",
      "42": "Shorts",
      "43": "Shows",
      "44": "Trailers"
    };
    const categoryN = categories.map(categoryId => categoryMapping[categoryId] || "Unknown");
    return categoryN;
}

// Function to reset remainingTime at midnight
function resetCountdownAtMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // Set to midnight
  const timeUntilMidnight = midnight - now;

  setTimeout(() => {
    remainingTime = originalCountdownTime;
    chrome.storage.local.set({ remainingTime: originalCountdownTime }, () => {
      console.log('Countdown time reset to original value at midnight.');
    });
  }, timeUntilMidnight);
}

// Fetch video details from YouTube Data API
function fetchVideoDetails(videoID, tabId) {
    console.log("videoID:", videoID, "tabId:", tabId);
    return new Promise((resolve, reject) => {
      console.log("apiKey:", apiKey);
      // Construct API URL
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoID}&key=${apiKey}&part=snippet`;
  
      // Fetch video details
      fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
          console.log(data);
          if (data && data.items && data.items.length > 0) {
            // Extract category information
            const categories = data.items[0].snippet.categoryId;
  
            // Return category names
            categoryNames = getCategoryNames([categories]);
            chrome.storage.local.set({ categoryNames });

            // Extract tag information
            tags = data.items[0].snippet.tags;
            chrome.storage.local.set({ tags });

            if (blockedCategories.some(category => categoryNames.includes(category)) || blockedTags.some(tag => tags.includes(tag))) {
                countdownActive = true;
                startCountdown(tabId, videoID);
              }

            resolve(categoryNames, tags);

          } else {
            reject(new Error('Video details not found.'));
          }
        })
        .catch(error => {
          console.error('Error fetching video details:', error);
          reject(error);
        });
  });
}
  
function updateIcon(tabId, tabUrl, countdownActive) {
  const timestamp1 = new Date().toLocaleTimeString();
  if (tabUrl && tabUrl.includes('youtube.com') && countdownActive == false) {
    chrome.action.setIcon({ tabId, path: 'icon-128.png' });
    console.log(`${tabId} Current site is Youtube. ${timestamp1} `)
  } else if (tabUrl && tabUrl.includes('youtube.com/watch') && countdownActive == true){
    chrome.action.setIcon({ tabId, path: 'icon-128-red.png' });
    console.log(`${tabId} Current site is Youtube with blocked video. ${timestamp1} `)
  } else {
    chrome.action.setIcon({ tabId, path: 'icon-128-gray.png' });
    console.log(`${tabId} Current site not Youtube. ${timestamp1} `)
  }
}
  
function redirectToHomePage(tabId) {
  console.log("tabId:", tabId)
  console.log("Sending redirect message.");
  chrome.tabs.sendMessage(tabId, { action: "redirect" });
}

function startCountdown(tabId, videoID) {
  countdownInterval = setInterval(() => {
    if (remainingTime <= 0) {
      clearInterval(countdownInterval);
      redirectToHomePage(tabId);
    } else {
      console.log(`Countdown: ${remainingTime} seconds remaining`);
      remainingTime--;

      // Store the updated remaining time
      chrome.storage.local.set({ remainingTime });
    }
  }, 1000);
}

function stopCountdown() {
  if (countdownInterval) {
    countdownActive = false;
    clearInterval(countdownInterval);
  }
}

function clearCategoriesAndTags() {
  console.log("removed categoryNames and tags");
  chrome.storage.local.remove('categoryNames');
  chrome.storage.local.remove('tags');
}

resetCountdownAtMidnight();
setInterval(resetCountdownAtMidnight, 24 * 60 * 60 * 1000);

chrome.runtime.onInstalled.addListener(async () => {
  const manifest = chrome.runtime.getManifest();

   // Get blocked categories and tags from storage
   chrome.storage.local.get(['blockedCategories', 'blockedTags'], async function (result) {
    blockedCategories = result.blockedCategories || blockedCategories;
    blockedTags = result.blockedTags || blockedTags;
    console.log("Blocked Categories:", blockedCategories);
    console.log("Blocked Tags:", blockedTags);
  
    // Get all tabs
    const tabs = await chrome.tabs.query({});
    
    for (const tab of tabs) {
      
      if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://") || tab.url.startsWith("https://chrome.google.com/webstore/")) {
        continue; // Skip tabs with chrome:// or chrome-extension:// URLs
      }
      
      // If the tab is snoozed/discarded/unloaded, skip
      if (tab.status === "suspended" || tab.status === "discarded" || tab.status === "unloaded") {
        continue;
      }

      console.log(tab.url, tab.status);
      updateIcon(tab.id, tab.url, countdownActive);
      
      // Execute content script for valid URLs
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: manifest.content_scripts[0].js,
        });
      } catch (error) {  // If tab is still snoozed/discarded/unloaded, print warning and refresh page
        console.warn(`Error executing content script for tab with URL: ${tab.url}: ${error}. Refreshing Page`);
        chrome.tabs.reload(tab.id, {bypassCache: true });
      }
    }
   });
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  updateIcon(tabId, tab.url, countdownActive);
  if (changeInfo.url && tab.url.includes('www.youtube.com/watch')) {
    console.log("sending message");
    // Wait for a short delay (e.g., 500ms) before sending the message
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, { action: "getVideoID" });
    }, 500);
  } else if (changeInfo.url && !tab.url.includes('www.youtube.com/watch')) {
    stopCountdown();
    clearCategoriesAndTags();
  }
});

// Listen for tab removal
chrome.tabs.onRemoved.addListener(tabId => {
  stopCountdown();
  console.log("tab removed.");
});
  
// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "sendVideoID") {
    videoID = message.videoID;
    const TabId = sender.tab.id;
    console.log("activeTabId:", TabId)
    fetchVideoDetails(videoID, TabId);
    // Now you have the videoID, you can use it in your background script logic
    // For example, you can fetch video details or start the countdown
    // ...
  } else if (message.action === "updateOptions") {
    // Update your background script logic based on the updated options
    // For example, you might want to update blocked categories and tags
    // based on the updated options.
    
    // Example: Update blocked categories and tags
    if (message.blockedCategories) {
      blockedCategories = message.blockedCategories;
    }
    if (message.blockedTags) {
      blockedTags = message.blockedTags;
    }

    // Perform any other necessary actions with the updated options

    // Send a response if needed
    sendResponse({ message: "Options updated successfully" });
  }
});
  
// Add a listener for tab activation
chrome.tabs.onActivated.addListener(activeInfo => {
  activeTabId = activeInfo.tabId;

  // Check if the active tab's URL is a YouTube video with a blocked category
  chrome.tabs.get(activeTabId, tab => {
    if (tab.url && tab.url.includes('www.youtube.com/watch')) {
      // Wait for a short delay (e.g., 500ms) before sending the message
      setTimeout(() => {
        chrome.tabs.sendMessage(activeTabId, { action: "getVideoID" });
      }, 500);
    } else {
      stopCountdown(); // Stop countdown if the tab is not a YouTube video
      clearCategoriesAndTags();
    }
  });
});