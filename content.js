// content.js

// Extract video ID from the current URL
var videoID = youtube_parser(window.location.href);

// Function to extract YouTube video ID from URL
function youtube_parser(url) {
  var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
  var searchExp = /https:\/\/www\.youtube\.com\/results\?search_query=(.*)/;
  var match = url.match(regExp);
  var searched = url.match(searchExp);
  if (searched) {
    localStorage.setItem("search", url);
  }
  return match && match[7].length == 11 ? match[7] : null;
}


// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "redirect") {
    // Perform the redirection logic here
    window.location.href = "https://www.youtube.com/";
  } else if (message.action === "getVideoID") {
    videoID = youtube_parser(window.location.href);
    chrome.runtime.sendMessage({ action: "sendVideoID", videoID: videoID});
  } else if (message.action === "testMessage") {
    console.log("Test message received!");
  }
});


