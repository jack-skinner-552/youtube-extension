// background.js (Service Worker)

const apiKey = 'AIzaSyCVVvtNww2mZYAnJCVUhRSG3K1gy5Ixhxo';
let countdownInterval = null;
let countdownDuration = 1 * 10; // 10 second countdown
let storedCategoryNames = [];
let tabStates = {};
let popupPort = null; // Store the connection port to the popup script
let isCountdownExpired = false; // Store countdown state

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

  const categoryNames = categories.map(categoryId => categoryMapping[categoryId] || "Unknown");
  return categoryNames;
}

// Fetch video details from YouTube Data API
function fetchVideoDetails(videoId) {
  return new Promise((resolve, reject) => {
    // Construct API URL
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`;

    // Fetch video details
    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        // Extract category information
        const categories = data.items[0].snippet.categoryId;

        // Return category names
        const categoryNames = getCategoryNames([categories]);
        resolve(categoryNames);
      })
      .catch(error => {
        console.error('Error fetching video details:', error);
        reject(error);
      });
  });
}

function updateIcon(tabId, tabUrl) {
  const timestamp1 = new Date().toLocaleTimeString();
  if (tabUrl && tabUrl.includes('youtube.com')) {
    chrome.action.setIcon({ tabId, path: 'icon-128.png' });
    console.log(`${tabId} Current site is Youtube. ${timestamp1} `)
  } else {
    chrome.action.setIcon({ tabId, path: 'icon-128-gray.png' });
    console.log(`${tabId} Current site not Youtube. ${timestamp1} `)
  }
}

function redirectToHomePage(tabId) {
  chrome.tabs.update(tabId, { url: 'https://www.youtube.com/' });
}

async function startCountdown(tabId) {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  // Clear countdownExpired when starting countdown
  chrome.storage.local.set({ countdownExpired: false });

  countdownInterval = setInterval(async () => {
    if (countdownDuration > 0) {
      countdownDuration -= 1;
      console.log(`Countdown: ${countdownDuration} seconds remaining.`);

      // Send countdown value to the popup script
      if (popupPort) {
        popupPort.postMessage({ countdownValue: countdownDuration, isCountdownExpired: false });
      }
    } else {
      clearInterval(countdownInterval);
      console.log("Countdown complete!");

      isCountdownExpired = true;
      chrome.storage.local.set({ countdownExpired: true });

      // Fetch the latest tab state
      const tabState = tabStates[tabId];

      if (tabState) {
        try {
          // Fetch the latest category names
          const categoryNames = await fetchVideoDetails(tabState.videoId);

          // Check if the tab is playing a video with Music or Gaming category
          if (categoryNames.includes("Music") || categoryNames.includes("Gaming")) {
            redirectToHomePage(tabId);
          }

          // Send countdown value to the popup script
          if (popupPort) {
            popupPort.postMessage({ countdownValue: 0, isCountdownExpired: true });
          }
        } catch (error) {
          console.error('Error fetching video details:', error);
        }
      }
    }
  }, 1000); // 1 second interval
}



function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
}

// Listen for connection from popup script
chrome.runtime.onConnect.addListener(port => {
  if (port.name === "popup-script") {
    popupPort = port;

    // Handle messages from popup script
    popupPort.onMessage.addListener(message => {
      // Handle messages from the popup script if needed
    });

    // Cleanup when popup script disconnects
    popupPort.onDisconnect.addListener(() => {
      popupPort = null;
    });
  }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    tabStates[tabId] = { url: changeInfo.url };
    updateIcon(tabId, changeInfo.url);

    // Check if the updated tab has a videoId and is in Music or Gaming category
    const tabState = tabStates[tabId];
    if (tabState.videoId) {
      fetchVideoDetails(tabState.videoId)
        .then(categoryNames => {
          storedCategoryNames = categoryNames;

          if (categoryNames.includes("Music") || categoryNames.includes("Gaming")) {
            startCountdown(tabId);
          } else {
            stopCountdown();
          }
        })
        .catch(error => {
          console.error('Error fetching video details:', error);
        });
    }
    // Check if the URL is no longer a YouTube video page
    if (!changeInfo.url.includes('youtube.com/watch')) {
      stopCountdown(); // Stop the countdown
    }
  }
});

// Listen for tab removal
chrome.tabs.onRemoved.addListener(tabId => {
  const tabState = tabStates[tabId];
  if (tabState && tabState.categoryNames && (tabState.categoryNames.includes("Music") || tabState.categoryNames.includes("Gaming"))) {
    stopCountdown();
  }
});

// Listen for tab activations
chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    updateIcon(tab.id, tab.url);
  });
});

// Listen for messages from content script, popup script, and others
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (typeof message === 'string') {
    const timestamp2 = new Date().toLocaleTimeString();
    console.log('Received Message:', message, timestamp2);
  }
  // Important: Return true to indicate that the response will be sent asynchronously
  return true;
});

// Listen for connection from content script
chrome.runtime.onConnect.addListener(port => {
  if (port.name === "content-script") {
    port.onMessage.addListener(message => {
      if (message.videoId) {
        // Process the videoId as needed
        const tabId = port.sender.tab.id;
        tabStates[tabId] = { ...tabStates[tabId], videoId: message.videoId };
        const tabState = tabStates[tabId];

        fetchVideoDetails(tabState.videoId)
          .then(categoryNames => {
            storedCategoryNames = categoryNames;
            const timestamp3 = new Date().toLocaleTimeString();
            console.log('Video Categories:', storedCategoryNames, timestamp3);

            if (categoryNames.includes("Music") || categoryNames.includes("Gaming")) {
              startCountdown(tabId);
            } else {
              stopCountdown();
            }
          })
          .catch(error => {
            console.error('Error fetching video details:', error);
            stopCountdown(); // Stop countdown if an error occurs
          });
      }
    });
  }
});
