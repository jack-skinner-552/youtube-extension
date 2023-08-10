// popup.js

chrome.runtime.sendMessage({ requestCategories: true }, response => {
  if (response && response.categoryNames) {
    const categoryList = document.getElementById('categoryList');
    response.categoryNames.forEach(categoryName => {
      const listItem = document.createElement('li');
      listItem.textContent = categoryName;
      categoryList.appendChild(listItem);
    });
  }
});