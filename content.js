// content.js

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

// Check if it's a YouTube video page
if (window.location.hostname === 'www.youtube.com' && window.location.pathname === '/watch') {
  chrome.runtime.sendMessage("Current page: Youtube.");
  // Extract video ID from the URL
  const videoId = new URLSearchParams(window.location.search).get('v');

  // Replace 'YOUR_API_KEY' with your actual YouTube Data API key
  const apiKey = 'AIzaSyCVVvtNww2mZYAnJCVUhRSG3K1gy5Ixhxo';

  // Construct API URL
  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`;

  // Fetch video details from YouTube Data API
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      // Extract category information
      const categories = data.items[0].snippet.categoryId;

      // Return category ids
      const categoryNames = getCategoryNames([categories]);
      chrome.runtime.sendMessage({ categoryNames });
    })
    .catch(error => console.error('Error fetching video details:', error));
}
