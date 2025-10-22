# KeyChange - Keyboard Language Correction Extension

A Chrome extension that detects and suggests real-time corrections for common typing errors caused by using the wrong keyboard layout (Hebrew/English).

## Features

- **Bidirectional correction:** Fixes both English text typed in Hebrew layout (`akuo` → `שלום`) and Hebrew text typed in English layout (`יקךךם` → `hello`).
- **Rich text editor support:** Works seamlessly in complex web apps such as Gmail, Google Docs, and others without breaking text formatting.
- **Comprehensive Hebrew dictionary:** Uses a Service Worker to load an extensive Hebrew_wordlist-based Hebrew dictionary with hundreds of thousands of words for precise detection.
- **Special character handling:** Correctly identifies and maps characters such as apostrophes (`'`), quotation marks (`"`) and question marks (`?`) as part of the keyboard mapping.

## Installation (for development)

1. Clone or download this repository.  
2. Download the hebrew.txt file from : https://drive.google.com/file/d/1JoCgpiywRUGFGFOdTOtXtI6Ge5mVZTzq/view?usp=sharing and add it to the data file.
3. Generate the data\hebrew-words.json file from hebrew.txt by running : "node convert.js" in the terminal
4. Open your browser (Chrome/Cursor) and navigate to `chrome://extensions`.  
5. Enable **Developer mode** using the toggle in the top-right corner.  
6. Click **Load unpacked**.  
7. Select the full project folder.

The extension is now active.




## Credits

- Hebrew dictionary based on the https://github.com/eyaler/hebrew_wordlists project.  
- English word validation powered by [Free Dictionary API](https://dictionaryapi.dev/).
