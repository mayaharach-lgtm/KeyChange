const fs = require('fs');
const path = require('path');

console.log('Starting conversion...');

// 1. Define file paths
const inputFilePath = path.join(__dirname, 'hebrew.txt');
const outputDir = path.join(__dirname, 'data');
const outputFilePath = path.join(outputDir, 'hebrew-words.json');

try {
  // 2. Read the giant text file
  console.log('Reading text file...');
  const textContent = fs.readFileSync(inputFilePath, 'utf8');

  // 3. Convert text to a clean array
  console.log('Converting to array...');
  const wordsArray = textContent
    .split('\n') // Split by new line
    .map(line => line.trim()) // Clean whitespace from each line
    .filter(line => line.length > 0); // Remove any empty lines

  // 4. Convert the array to a JSON string
  console.log('Stringifying JSON...');
  const jsonContent = JSON.stringify(wordsArray);

  // 5. Ensure the 'data' directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
    console.log('Created "data" directory.');
  }

  // 6. Write the new JSON file
  console.log('Writing JSON file...');
  fs.writeFileSync(outputFilePath, jsonContent);

  console.log('------------------');
  console.log(`✅ Success! Converted ${wordsArray.length} words.`);
  console.log(`File saved to: ${outputFilePath}`);

} catch (err) {
  console.error('❌ Error during conversion:', err.message);
  console.error("Please make sure 'hebrew.txt' is in the same folder as this script.");
}