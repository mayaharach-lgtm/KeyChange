let hebrewDict = new Set();
let isLoading = false;
let loadPromise = null; // This will hold the "promise" of the load

async function loadDictionary() {
  // If we are already loading, just return the existing promise
  if (isLoading) return loadPromise;
  
  isLoading = true;
  console.log('Starting dictionary load...'); // Log message #1

  loadPromise = new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(chrome.runtime.getURL('data/hebrew-words.json'));
      if (!res.ok) {
        throw new Error(`Failed to fetch dictionary: ${res.statusText}`);
      }
      
      console.log('... fetched file, parsing JSON (this may take a few seconds)...'); // Log message #2
      
      const list = await res.json();
      hebrewDict = new Set(list);
      
      console.log(`📘 Hebrew dictionary loaded successfully: ${hebrewDict.size} words`); // Log message #3 (Success)
      
      isLoading = false;
      resolve();
    } catch (err) {
      console.error('❌ Failed to load dictionary', err); // Log message #3 (Error)
      isLoading = false;
      reject(err);
    }
  });
  return loadPromise;
}

// --- START LOADING IMMEDIATELY ---
// This line runs the moment the service worker starts up
loadDictionary();

// --- Listen for messages from content scripts ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'isHebrewWord') {
    // Check if the dictionary is ready
    if (hebrewDict.size > 0) {
      const isValid = hebrewDict.has(request.word);
      sendResponse({ isValid });
      return false; // We responded synchronously
    }

    // If not ready, wait for the load to finish
    console.warn('Dictionary not ready, waiting for load to complete...');
    loadPromise
      .then(() => {
        const isValid = hebrewDict.has(request.word);
        sendResponse({ isValid });
      })
      .catch(err => {
        console.error("Error during dictionary check:", err);
        sendResponse({ isValid: false }); // Send a response even on error
      });
    
    return true; // We will respond asynchronously
  }
  return false; // Default for other message types
});