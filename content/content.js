console.log('KeyChange v2.5 loaded (API Logic Fix)');

// --- 1. English-to-Hebrew Map (Case-Sensitive) ---
const engToHebMap = new Map([
  // Lowercase
  ['q', '/'], ['w', '\u05F3'], ['e', 'ק'], ['r', 'ר'], ['t', 'א'], ['y', 'ט'], ['u', 'ו'], ['i', 'ן'], ['o', 'ם'], ['p', 'פ'],
  ['a', 'ש'], ['s', 'ד'], ['d', 'ג'], ['f', 'כ'], ['g', 'ע'], ['h', 'י'], ['j', 'ח'], ['k', 'ל'], ['l', 'ך'],
  ['z', 'ז'], ['x', 'ס'], ['c', 'ב'], ['v', 'ה'], ['b', 'נ'], ['n', 'מ'], ['m', 'צ'],
  [',', 'ת'], ['.', 'ץ'], [';', 'ף'], ["'", '\u05F3'], 
  // Uppercase
  ['Q', '?'], ['W', '\u05F4'], ['E', 'ק'], ['R', 'ר'], ['T', 'א'], ['Y', 'ט'], ['U', 'ו'], ['I', 'ן'], ['O', 'ם'], ['P', 'פ'],
  ['A', 'ש'], ['S', 'ד'], ['D', 'ג'], ['F', 'כ'], ['G', 'ע'], ['H', 'י'], ['J', 'ח'], ['K', 'ל'], ['L', 'ך'],
  ['Z', 'ז'], ['X', 'ס'], ['C', 'ב'], ['V', 'ה'], ['B', 'נ'], ['N', 'מ'], ['M', 'צ'],
  ['<', 'ת'], ['>', 'ץ'], [';', 'ף'] 
]);

// --- 2. Hebrew-to-English Map (UPDATED) ---
const hebToEngMap = new Map([
  ['/', 'q'], 
  ['\u05F3', 'w'], // Geresh
  ['\u05F4', 'w'], // Gershayim
  ["'", 'w'],      // Apostrophe
  ['ק', 'e'], ['ר', 'r'], ['א', 't'], ['ט', 'y'], ['ו', 'u'], ['ן', 'i'], ['ם', 'o'], ['פ', 'p'],
  ['ש', 'a'], ['ד', 's'], ['ג', 'd'], ['כ', 'f'], ['ע', 'g'], ['י', 'h'], ['ח', 'j'], ['ל', 'k'], ['ך', 'l'],
  ['ז', 'z'], ['ס', 'x'], ['ב', 'c'], ['ה', 'v'], ['נ', 'b'], ['מ', 'n'], ['צ', 'm'],
  ['ת', ','], ['ץ', '.'], ['ף', ';'],
  ['?', 'q'] 
]);


// --- 3. detectLang ---
function detectLang(word) {
  if (/[A-Za-z]/.test(word) && !/[\u0590-\u05FF]/.test(word)) return 'en';
  if (/[\u0590-\u05FF]/.test(word) && !/[A-Za-z]/.test(word)) return 'he';
  if (/^[A-Za-z\u05F3\u0027]+$/.test(word)) return 'en'; // English + Geresh/Apostrophe
  if (/^[\u0590-\u05FF\u05F3\u0027]+$/.test(word)) return 'he'; // Hebrew + Geresh/Apostrophe
  return 'unknown';
}

// --- 4. convertWord ---
function convertWord(word) {
  if (!word) return word;
  const lang = detectLang(word);
  let map;
  if (lang === 'en') {
    map = engToHebMap;
  } else if (lang === 'he') {
    map = hebToEngMap;
  } else {
    return word;
  }
  let converted = '';
  for (const ch of word) {
    converted += map.get(ch) || ch;
  }
  return converted;
}

// --- 5. Dictionary checks (Responsible for cleaning) ---
async function isHebrewWord(word) {
  const cleanWord = word.replace(/[.,!?;:(){}\[\]<>/\\]/g, ''); 
  if (!cleanWord) return false;
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'isHebrewWord',
      word: cleanWord
    });
    return response && typeof response.isValid === 'boolean' ? response.isValid : false;
  } catch (err) {
    console.error("Error communicating with background script:", err.message);
    return false;
  }
}

async function isEnglishWord(word) {
  const cleanWord = word.replace(/[^A-Za-z]/g, '');
  if (!cleanWord) return false;
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord.toLowerCase()}`);
    return res.ok;
  } catch {
    return false;
  }
}

async function isRealWord(word) {
  const lang = detectLang(word);
  if (lang === 'en') return await isEnglishWord(word);
  if (lang === 'he') return await isHebrewWord(word);
  return false;
}

// --- 6. Rich Text / Input replacement function (No changes) ---
function replaceLastWord(target, suggestion) {
  const sel = window.getSelection();
  const node = sel.focusNode;
  const offset = sel.focusOffset;

  if (!target.isContentEditable && ['INPUT','TEXTAREA'].includes(target.tagName)) {
    const val = target.value;
    const pos = typeof target.selectionStart === 'number' ? target.selectionStart : val.length;
    const before = val.slice(0, pos);
    const after  = val.slice(pos);
    const m = before.match(/(\S+)(\s*)$/);
    if (!m) return;
    const newBefore = before.slice(0, before.length - m[0].length) + suggestion + (m[2] || ' ');
    target.value = newBefore + after;
    const newPos = newBefore.length;
    target.setSelectionRange(newPos, newPos);
    target.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }

  if (target.isContentEditable && node && node.nodeType === Node.TEXT_NODE) {
    const textBeforeCaret = node.textContent.slice(0, offset);
    const match = textBeforeCaret.match(/(\S+)$/);
    if (!match) return;
    const wrongWord = match[1];
    const textToInsert = suggestion + ' ';
    const range = document.createRange();
    range.setStart(node, offset - wrongWord.length);
    range.setEnd(node, offset);
    range.deleteContents();
    const textNode = document.createTextNode(textToInsert);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    sel.removeAllRanges();
    sel.addRange(range);
    target.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

// --- 7. Tooltip UI (No changes) ---
function showSuggestion(target, wrongWord, suggestion) {
  const old = document.getElementById('keyfix-tooltip');
  if (old) old.remove();

  const tooltip = document.createElement('div');
  tooltip.id = 'keyfix-tooltip';
  tooltip.textContent = `Did you mean "${suggestion}"?`;
  tooltip.style.position = 'absolute';
  tooltip.style.background = '#333';
  tooltip.style.color = 'white';
  tooltip.style.padding = '6px 10px';
  tooltip.style.borderRadius = '8px';
  tooltip.style.fontSize = '13px';
  tooltip.style.cursor = 'pointer';
  tooltip.style.zIndex = 99999;
  tooltip.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';

  tooltip.addEventListener('click', () => {
    replaceLastWord(target, suggestion);
    tooltip.remove();
  });

  document.body.appendChild(tooltip);
  const rect = target.getBoundingClientRect();
  tooltip.style.left = rect.left + window.scrollX + 'px';
  tooltip.style.top = rect.bottom + window.scrollY + 6 + 'px';
  setTimeout(() => tooltip.remove(), 5000);
}

// --- 8. Main listener (UPDATED LOGIC) ---
document.addEventListener('input', async e => {
  const target = e.target;
  if (!target || (!target.isContentEditable && !['INPUT', 'TEXTAREA'].includes(target.tagName))) return;

  let text = '';
  if (target.isContentEditable) {
    const sel = window.getSelection();
    if (sel.focusNode && sel.focusNode.textContent) {
      text = sel.focusNode.textContent.slice(0, sel.focusOffset);
    }
  } else {
    text = (target.value || '').slice(0, target.selectionStart);
  }

  const lastChar = text.slice(-1);
  if (![' ', '\n', '.', ',', '!', '?'].includes(lastChar)) return;

  const match = text.trim().match(/(\S+)$/);
  if (!match) return;

  const lastWordRaw = match[1];
  if (!lastWordRaw) return;

  const lang = detectLang(lastWordRaw);
  if (lang === 'unknown') return;

  const originalIsValid = await isRealWord(lastWordRaw); 
  const convertedWord = convertWord(lastWordRaw); 
  if (convertedWord === lastWordRaw) return;

  // --- ★★★ THE FIX ★★★ ---
  // If the original language was Hebrew, we assume the English conversion is
  // what the user wanted, because the English API is unreliable.
  // For en->he, we still check the Hebrew dictionary (`isRealWord`).
  const convertedIsValid = (lang === 'he') ? true : await isRealWord(convertedWord);

  if (convertedIsValid && !originalIsValid) {
    console.log(`"${lastWordRaw}" (invalid) → suggestion: "${convertedWord}" (valid)`);
    showSuggestion(target, lastWordRaw, convertedWord);
  } else if (originalIsValid) {
    console.log(`"${lastWordRaw}" is valid. Assuming no error.`);
  } else {
    console.log(`"${lastWordRaw}" not found. Conversion "${convertedWord}" also not found.`);
  }
});