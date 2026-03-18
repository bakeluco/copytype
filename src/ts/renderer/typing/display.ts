import { showDialog } from "../dialogs.js";
import { settings } from "../settings.js";
import { getCorrectChars } from "../stats.js";
import { stopTimer } from "../timer.js";
import { getWordsTyped, setText, setTyped, text, typed, WrongSpace } from "./test.js";
import { currentBookData, currentBookStats, fullText, loadTextForTest, replaceAccents, saveTyping } from "./load-save.js"
export var currentPage = 0;

export function setCurrentPage(newPage: number) {
  currentPage = newPage;
}

// Zoom levels: 1 = default view, 5 = whole chapter (5 levels total)
function zoomLevel(): number {
  return settings.zoomLevel ?? 1;
}

function isChapterZoom(): boolean {
  return zoomLevel() >= 5;
}

function getZoomWordCount(): number {
  const counts = [250, 500, 1000, 2000, Number.MAX_SAFE_INTEGER];
  return counts[Math.min(zoomLevel() - 1, counts.length - 1)];
}

function applyZoomFont() {
  const sizes = [2.3, 1.8, 1.3, 0.9, 0.6];
  const idx = Math.min(zoomLevel() - 1, sizes.length - 1);
  const size = zoomLevel() === 1 ? settings.fontSize : sizes[idx];
  $(":root").css("--font-size", size + "rem");
}

export function zoomIn() {
  if (zoomLevel() > 1) {
    settings.zoomLevel--;
    window.electron.saveSettings(settings);
    nextWordSet(true);
  }
}

export function zoomOut() {
  if (zoomLevel() < 5) {
    settings.zoomLevel++;
    window.electron.saveSettings(settings);
    nextWordSet(true);
  }
}

// Cache of word counts per chapter index (cleared when book changes)
var chapterWordCountCache: number[] = [];
var lastCachedBook = "";

function getChapterWordCount(i: number): number {
  // Always use live fullText for the current chapter (it may have transforms applied)
  if (i === currentBookStats.chapter) return fullText.length;

  // Clear cache when a different book is loaded
  const bookName = currentBookStats?.bookName ?? "";
  if (bookName !== lastCachedBook) {
    chapterWordCountCache = [];
    lastCachedBook = bookName;
  }

  if (chapterWordCountCache[i] !== undefined) return chapterWordCountCache[i];
  const words = window.electron.getDataFromJSON(currentBookData.textPath[i]);
  chapterWordCountCache[i] = words.length;
  return chapterWordCountCache[i];
}

function updatePageCounters() {
  if (!currentBookStats || !currentBookData?.textPath || !fullText?.length) return;

  // Fixed page size for counting — independent of zoom so counters are always meaningful
  const PAGE_SIZE = 250;
  const pagesFor = (n: number) => Math.max(1, Math.ceil(n / PAGE_SIZE));

  // Include in-progress typing so counters update live as the user types
  const wordsTypedInChapter = currentBookStats.typedPos + getWordsTyped().length;

  const chapCurrent = Math.floor(wordsTypedInChapter / PAGE_SIZE) + 1;
  const chapTotal = pagesFor(fullText.length);
  const chapPct = Math.min(100, Math.round(wordsTypedInChapter / fullText.length * 100));
  $("#chapter-page-counter").text(`ch. ${chapCurrent}/${chapTotal}`);
  $("#chapter-pct-inline").text(`ch. ${chapPct}%`);

  let bookTypedWords = wordsTypedInChapter;
  let bookTotalWords = fullText.length;
  let bookCurrent = chapCurrent;
  let bookTotal = chapTotal;
  for (let i = 0; i < currentBookData.textPath.length; i++) {
    if (i === currentBookStats.chapter) continue;
    const wc = getChapterWordCount(i);
    const pages = pagesFor(wc);
    bookTotalWords += wc;
    bookTotal += pages;
    if (i < currentBookStats.chapter) {
      bookTypedWords += wc;
      bookCurrent += pages;
    }
  }
  const bookPct = Math.min(100, Math.round(bookTypedWords / bookTotalWords * 100));
  $("#book-page-counter").text(`bk. ${bookCurrent}/${bookTotal}`);
  $("#book-pct-inline").text(`bk. ${bookPct}%`);
}

var pageLengths: {
  [key: number]: {
    chapter: number,
    startPos: number,
    endPos: number,
  }
} = {};


var caretPosX: number;
var caretPosY: number;

var showChapterEvent: NodeJS.Timeout;

// Caret is moved on window resize
$(window).resize(function () {
  if (currentBookStats) {
    nextWordSet(true);
  }
  if (!$("#words").hasClass("hidden")) {
    updateCaret();
  }
});

// Updates the caret position
export function updateCaret(init = false) {
  updatePageCounters();
  // Handle caret animation
  if (typed.length == 0 && !$('#caret').hasClass('animate-caret')) {
    $('#caret').addClass("animate-caret");
  } else if (typed.length > 0 && $('#caret').hasClass('animate-caret')) {
    $('#caret').removeClass("animate-caret");
  }

  if ($("#words").find(".word").length) {

    const typedWords = getWordsTyped();

    // Get the index of the current word
    let currentWordIndex;
    if (typedWords.length > 0) {
      currentWordIndex = typedWords.length - 1;
    } else {
      currentWordIndex = 0;
    }

    const currentWord = typedWords[typedWords.length - 1].split("");

    // Get the index of the current letter
    let currentCharIndex;
    if (currentWord.length > 0) {
      currentCharIndex = currentWord.length - 1;
    } else {
      currentCharIndex = 0;
    }

    // List of letters in the current typed word
    const lettersList = $("#words").find(".word").eq(currentWordIndex).children();
    let lastLetter: JQuery<HTMLElement>;

    // If the current word is longer than the displayed word, get the last letter of the displayed word
    if (currentWord.length > lettersList.length) {
      lastLetter = lettersList.eq(lettersList.length - 1);

      // Otherwise, get the current letter 
    } else {
      lastLetter = lettersList.eq(currentCharIndex);
    }

    let charPosition = lastLetter.position();
    let width = lastLetter.width()

    const caret = $("#caret");

    // Calculate the caret position
    if (typed.length == 0) {
      width = 0;
      charPosition = $("#words").find("div").eq(0).children().eq(0).position();
    }
    const caretWidth = caret[0].getBoundingClientRect().width / 2;
    if (settings.caretStyle == "default") {
      caretPosX = (currentWord.length == 0) ? charPosition.left - caretWidth : charPosition.left + width - caretWidth;
    } else {
      caretPosX = (currentWord.length == 0) ? charPosition.left : charPosition.left + width;
    }

    caretPosY = charPosition.top;

    // Move the caret (animate if needed)
    if (init) {
      caret.stop(true, true);
      caret.css("left", caretPosX);
      caret.css("top", caretPosY);
    } else {
      const duration = (settings.smoothCaret) ? 100 : 0;

      caret.stop(true, false).animate({
        left: caretPosX,
        top: caretPosY
      }, duration);
    }

    // In chapter zoom the page scrolls, so keep the caret visible
    if (isChapterZoom()) {
      document.getElementById('caret')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }
}

function hideWords() {
  $("#words").css("height", 0);
}

function showWords() {
  $("#words").css("height", "auto");
}

function buildWordElements(container: JQuery, words: string[]) {
  for (const word of words) {
    container.append(`<div class="word"></div>`);
    const currentWord = container.children().last()[0];
    for (const char of word) {
      const letterElem = document.createElement("letter");
      letterElem.setAttribute('char', char);
      if (char == "\n") {
        letterElem.classList.add("nlChar");
        letterElem.innerHTML = `<i class="fas fa-angle-down"></i>`;
        $(currentWord).append(letterElem);
        container.append("<br>");
      } else {
        letterElem.innerHTML = char;
      }
      $(currentWord).append(letterElem);
    }
  }
}

function renderPastWords() {
  $("#past-words").empty();
  if (isChapterZoom() && currentBookStats.typedPos > 0) {
    buildWordElements($("#past-words"), fullText.slice(0, currentBookStats.typedPos));
  }
}

function showChapterLabel() {
  changeDivisionText();

  if (settings.showPageLabel == 'on') {
    $("#chapter-label").removeClass("hide-chapter-label");
    clearTimeout(showChapterEvent);
    showChapterEvent = setTimeout(() => {
      $("#chapter-label").addClass("hide-chapter-label")
    }, 2000)
  }
}

// Poorly named, displays "Page 1" etc
export function changeDivisionText() {
  if (currentBookData.division != "") {
    $("#chapter-label").text(`${currentBookData.division} ${currentBookStats.chapter + 1}`);
  }
}

export function prevChapter() {
  if (currentBookStats.chapter > 0) {
    currentBookStats.typedPos = 0;
    currentBookStats.chapter--;
    changeDivisionText();
    loadTextForTest();
    nextWordSet(true);
  }
}

export function prevPage() {
  prevWordSet();
}

export function nextPage() {
  nextWordSet();
}

export function nextChapter() {
  if (currentBookStats.chapter < currentBookData.textPath.length - 1) {
    currentBookStats.typedPos = 0;
    currentBookStats.chapter++;
    changeDivisionText();
    loadTextForTest();
    nextWordSet(true);
  }
}

function prevWordSet() {
  setTyped([]);
  currentPage--;
  // Previous chapter if at the beginning of the chapter
  if (currentBookStats.typedPos == 0) {
    if (currentBookStats.chapter > 0) {
      currentBookStats.chapter--;
    } else {
      currentPage++;
    }
    showChapterLabel();
    loadTextForTest();
    currentBookStats.typedPos = fullText.length;
  }

  // Page already loaded
  if (Object.keys(pageLengths).includes(currentPage.toString())) {
    if (currentBookStats.chapter != pageLengths[currentPage].chapter) {
      currentBookStats.chapter = pageLengths[currentPage].chapter;
      showChapterLabel();
      loadTextForTest();
    }

    currentBookStats.typedPos = pageLengths[currentPage].startPos;
    setText(fullText.slice(pageLengths[currentPage].startPos));
    text.splice(pageLengths[currentPage].endPos - pageLengths[currentPage].startPos);
    // Load new page
  } else {
    const startPos = currentBookStats.typedPos;
    const wordCount = isChapterZoom() ? fullText.length : getZoomWordCount();
    currentBookStats.typedPos -= wordCount;
    if (currentBookStats.typedPos < 0) currentBookStats.typedPos = 0;
    setText(fullText.slice(currentBookStats.typedPos));
    text.splice(startPos - currentBookStats.typedPos);
  }

  // Replace accents in lazy mode
  if (settings.lazyMode) {
    const new_text = [];
    for (const word of text) {
      new_text.push(replaceAccents(word));
    }
    setText(new_text);
  }

  stopTimer();
  saveTyping(false);

  // Add words to screen
  hideWords();
  $("#words").empty();
  for (const word of text) {
    $("#words").append(`<div class="word"></div>`);
    const children = $("#words").children();
    const currentWord = children[children.length - 1];

    for (const char of word) {
      const letterElem = document.createElement("letter");
      letterElem.setAttribute('char', char);

      if (char == "\n") {
        letterElem.classList.add("nlChar");
        letterElem.innerHTML = `<i class="fas fa-angle-down"></i>`
        $(currentWord).append(letterElem);
        $("#words").append("<br>");
      } else {
        letterElem.innerHTML = char;
      }
      $(currentWord).append(letterElem);
    }
  }

  $("#words").append("<div id='caret'></div>");

  // Load page
  $("#caret").ready(function () {
    if (!isChapterZoom()) {
      // Remove the words that aren't on the screen
      while ($("#words .word:last").position().top > $(window).height() - 160) {
        $("#words .word").first().remove();
        text.shift();
        if ($("#words").children().first().prop("nodeName") == "BR") {
          $("#words").children().first().remove();
        }
        currentBookStats.typedPos++;
      }
    }

    // Save current page
    if (!Object.keys(pageLengths).includes(currentPage.toString())) {
      setPageLengths();
    }

    updatePageCounters();
    updateCaret(true);
    showWords();
  });
}

export function scrollWords() {

  console.log("scrolling");
}

export function nextWordSet(keepCurrent = false) {
  if (currentBookStats.finishedBook) { return; }

  $("#words").toggleClass("flipped", settings.flipTestColors);
  $("#words").toggleClass("colorfulMode", settings.colorfulMode);
  $("#wpm-counter").toggleClass("hidden", !settings.showLiveWpm);
  $("#acc-counter").toggleClass("hidden", !settings.showLiveAcc);
  $("#chapter-page-counter").removeClass("hidden");
  $("#book-page-counter").removeClass("hidden");
  $("#chapter-pct-inline").removeClass("hidden");
  $("#book-pct-inline").removeClass("hidden");
  $("#page-prev").toggleClass("hidden", !settings.pageNavigation);
  $("#page-next").toggleClass("hidden", !settings.pageNavigation);
  $("#chap-prev").toggleClass("hidden", !settings.chapterNavigation);
  $("#chap-next").toggleClass("hidden", !settings.chapterNavigation);
  $("#pause-menu").toggleClass("hidden", !settings.pausePlayButton);
  $("#typing").toggleClass("chapter-zoom", isChapterZoom());
  applyZoomFont();
  if (settings.showPageLabel == "always on") {
    $("#chapter-label").removeClass("hide-chapter-label");
  }

  if (settings.pageNavigation && !settings.chapterNavigation) {
    $("#page-prev").css("margin-right", "30px")
  } else {
    $("#page-prev").css("margin-right", "10px")
  }
  if (settings.chapterNavigation && !settings.pageNavigation) {
    $("#chap-prev").css("margin-right", "0")
  } else {
    $("#chap-prev").css("margin-right", "30px")
  }

  if (!keepCurrent) {
    currentPage++;
    currentBookStats.wpm.correctChars += getCorrectChars();
    currentBookStats.typedPos += text.length;
    setTyped([]);
  } else pageLengths = {};

  // Chapter finished
  if (currentBookStats.typedPos >= fullText.length - 1) {

    // Finish Book
    if (currentBookStats.chapter == currentBookData.textPath.length - 1) {
      $("#book-finished").ready(() => {
        currentBookStats.finishedBook = true;
        saveTyping();
        delete settings.currentBook;
        window.electron.saveSettings(settings);
        showDialog('book-finished');

      })
      return;

      // Next Chapter
    } else {
      currentBookStats.chapter++;
      showChapterLabel();
      currentBookStats.typedPos = 0;
      loadTextForTest();
    }
  }

  // Page already loaded
  if (Object.keys(pageLengths).includes(currentPage.toString())) {
    if (currentBookStats.chapter != pageLengths[currentPage].chapter) {
      currentBookStats.chapter = pageLengths[currentPage].chapter;
      showChapterLabel();
      loadTextForTest();
    }

    currentBookStats.typedPos = pageLengths[currentPage].startPos;
    setText(fullText.slice(pageLengths[currentPage].startPos));
    text.splice(pageLengths[currentPage].endPos - pageLengths[currentPage].startPos);

    // Load page
  } else {
    setText(fullText.slice(currentBookStats.typedPos))
    if (!isChapterZoom()) {
      text.splice(getZoomWordCount());
    }
  }

  // Replace accents in lazy mode
  if (settings.lazyMode) {
    const new_text = [];
    for (const word of text) {
      new_text.push(replaceAccents(word));
    }
    setText(new_text);
  }

  stopTimer();
  if (!keepCurrent) {
    saveTyping(false);
  }

  // Add words to screen
  hideWords();
  $("#words").empty();
  renderPastWords();
  buildWordElements($("#words"), text);

  // Styles words that are already typed
  if (keepCurrent && typed.length > 0) {
    const currentTyped = getWordsTyped();
    for (let wordIndex = 0; wordIndex < currentTyped.length; wordIndex++) {
      const letterCount = currentTyped[wordIndex].length - 1;

      for (let letterIndex = 0; letterIndex <= letterCount; letterIndex++) {
        styleWord(wordIndex, letterIndex, true);
      }

      if (letterCount == -1) {
        styleWord(wordIndex, 0);
      }
    }
  }

  $("#words").append(`<div id='caret' class='${settings.caretStyle}'></div>`);

  // Once the list of words has loaded, remove the words that aren't on the screen
  $("#caret").ready(function () {
    if (!isChapterZoom()) {
      removeWordsOffScreen();
    }

    const wordsTyped = getWordsTyped();
    if (wordsTyped.length >= text.length) {
      nextWordSet();
    }

    // Save current page
    if (!Object.keys(pageLengths).includes(currentPage.toString())) {
      setPageLengths();
    }

    updatePageCounters();
    updateCaret(true);
    showWords();
  });
}

export function removeWordsOffScreen() {
  for (const child of $("#words").find("div").toArray().reverse()) {
    if ($(child).position().top > $(window).height() - 160 && $(child).attr('id') != "caret") {
      child.remove();
      text.pop();
      if ($("#words").children().eq(-2).prop("nodeName") == "BR") {
        $("#words").children().eq(-2).remove();
      }
    }
  }
}

export function setPageLengths() {
  pageLengths[currentPage] = {
    startPos: currentBookStats.typedPos,
    endPos: currentBookStats.typedPos + text.length,
    chapter: currentBookStats.chapter
  }
}

export function styleWord(wordIndex = getWordsTyped().length - 1, letterIndex: number = undefined, addExtraLetters = false) {
  if (typed.length == 0) return;

  const typedWords = getWordsTyped();
  const typedWord = typedWords[wordIndex].split("");

  if (letterIndex == undefined) {
    letterIndex = typedWord.length - 1;
  }

  const typedLetter: WrongSpace | string = typedWords[wordIndex][letterIndex];

  const shownWord = $("#words").find("div").eq(wordIndex);
  const shownLetter = shownWord.children().eq(letterIndex);
  const lastShownWord = $("#words").find("div").eq(wordIndex - 1)

  const correctWord = text[wordIndex];
  const correctWordPart = correctWord.slice(0, typedWord.length);

  const correctLetter = correctWord[letterIndex];

  const newLetter = typedLetter instanceof WrongSpace ? "_" : typedLetter;

  if (settings.highlightMode == "letter") {
    if (!settings.blindMode) {

      if (typedWord.length > 0) {
        if (typedLetter == correctLetter && !shownLetter.hasClass("correct") && shownLetter.html() != " ") {
          shownLetter.addClass("correct");
        } else if (typedLetter != correctLetter && !shownLetter.hasClass("incorrect")) {
          shownLetter.addClass("incorrect");
          if (settings.indicateTypos == "below") {
            const hint = document.createElement("hint");
            hint.innerHTML = newLetter;
            shownLetter.append(hint);
          } else if (settings.indicateTypos == "replace") {
            shownLetter.text(newLetter);
          }

          if (letterIndex > correctWord.length - 1 && addExtraLetters) {
            const letterElem = document.createElement("letter");
            letterElem.setAttribute('char', newLetter);
            letterElem.classList.add('incorrect', 'extra')
            letterElem.innerHTML = newLetter;

            const prevLetter = $("#words").find("div").eq(wordIndex).children().eq(letterIndex - 1);

            $(letterElem).insertAfter(prevLetter);
          }
        }
      }
      checkError(wordIndex - 1);
    } else {
      if (typedWord.length > 0) {
        shownLetter.addClass("correct");
      }
      if (wordIndex >= 1) {
        for (const letter of lastShownWord.children()) {
          $(letter).addClass("correct");
        }
      }
    }
  } else if (settings.highlightMode == "word") {
    for (const word of $("#words").find(".word")) {
      if (word != shownWord as unknown as HTMLElement) {
        for (const letter of $(word).find('letter')) {
          $(letter).removeClass("correct");
        }
      }
    }

    if (typedWord.join("") != correctWordPart && !settings.blindMode) {
      for (const letter of shownWord.find("letter")) {
        $(letter).removeClass("correct").addClass("incorrect");
      }
    } else {
      for (const letter of shownWord.find("letter")) {
        $(letter).removeClass("incorrect").addClass("correct");
      }
    }

    if (!settings.blindMode) {
      if (typedWord.length > 0) {

        if (typedLetter != correctLetter) {
          if (settings.indicateTypos == "below") {
            const hint = document.createElement("hint");
            hint.innerHTML = newLetter;
            shownLetter.append(hint);
          } else if (settings.indicateTypos == "replace") {
            shownLetter.text(newLetter);
          }
        }
      }

      checkError(wordIndex - 1);
    }
  }
}

function checkError(index: number) {
  const currentTypedWords = getWordsTyped();
  const lastTypedWord = currentTypedWords[index]
  const correctLastWord = text[index]
  const lastShownWord = $("#words").find("div").eq(index)

  if (lastTypedWord != correctLastWord) {
    lastShownWord.addClass("error");
  }
}

