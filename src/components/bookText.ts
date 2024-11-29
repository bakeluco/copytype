import { RefObject } from "react";

/**
 * A class that represents the text of a book.
 * Sections of the book are separated by two fences: charsTyped and charsDisplayed.
 */
export class BookText {
  /**
   * The full text of the book.
   */
  private text: string;

  /**
   * The index of the characters that have already been typed
   * The fence between previous and current characters.
   */
  private charsTyped: number;

  /**
   * The index of the characters that are being displayed.
   * The fence between current and next characters.
   */
  private charsDisplayed: number;

  constructor(text: string, charsTyped: number) {
    this.text = text;
    this.charsTyped = charsTyped;
    this.charsDisplayed = 0;

    // Initializes charsDisplayed
    this.getMoreChars(1000);
  }

  /**
   * Gets the words that are currently displayed (between charsTyped and charsDisplayed)
   */
  getDisplayedWords() {
    return this.text.slice(this.charsTyped, this.charsDisplayed + 1);
  }

  /**
   * Gets the number of characters that are currently displayed (between charsTyped and charsDisplayed)
   */
  getDisplayedCharsLength() {
    return this.charsDisplayed - this.charsTyped;
  }

  /**
   * Gets new words to display, shifts the displayed words fence.
   * @param chars Number of characters to display. Length of words added <= chars
   * @returns New displayed words
   */
  getMoreChars(chars: number) {
    const displayedWords = this.getDisplayedWords();
    let newLength = chars;
    let newDisplayedWords = displayedWords;

    while (newDisplayedWords.length <= displayedWords.length) {
      newDisplayedWords = this.getWordsByLength(newLength);
      newLength *= 2;
    }

    this.charsDisplayed = this.charsTyped + newDisplayedWords.length;

    return newDisplayedWords;
  }

  /**
   * Gets the words that are less than or equal to the number of characters.
   * @param characters The number of characters to display
   * @returns The words that are less than or equal to the number of characters
   */
  getWordsByLength(characters: number) {
    const words = this.text.split(" ");
    const displayedWords: string[] = [];

    const needsMoreWords = () =>
      displayedWords.join(" ").length + words[0].length < characters;

    while (words.length !== 0 && needsMoreWords()) {
      const word = words.shift()!;
      displayedWords.push(word);
    }
    return displayedWords.join(" ");
  }

  /**
   * Runs when the display is initialized or resized.
   * Moves the displayed words fence to the first word that is off screen.
   * @param wordRefsGrid The grid of word refs
   * @returns The new displayed words and refs, and whether the display is still loading
   * (needed more words)
   */
  updateDisplay(wordsContainerRef: RefObject<HTMLDivElement>) {
    // get the index of the first word that is off screen
    const wordIndex = this.findOffScreenWord(wordsContainerRef);

    // if one wasn't found, we need more words!
    if (wordIndex === -1) {
      const displayedWords = this.getMoreChars(this.getDisplayedCharsLength());

      return {
        displayedWords,
        stillLoading: true,
      };
    }

    // slice displayed words to only on-screen ones.
    const displayedWords = this.getDisplayedWords();
    const onScreenWords = displayedWords
      .split(" ")
      .slice(0, wordIndex)
      .join(" ");

    // if we've reached the end of our displayed words, we might need more
    if (wordIndex > displayedWords.split(" ").length - 1) {
      return {
        displayedWords: this.getMoreChars(this.getDisplayedCharsLength()),
        stillLoading: true,
      };
    }

    // adjust the chars dispalyed fence
    this.charsDisplayed = this.charsTyped + onScreenWords.length - 1;

    return {
      displayedWords: this.getDisplayedWords(),
      stillLoading: false,
    };
  }

  /**
   * Find the index of the first word that is off screen
   * @param wordRefsGrid The grid of word refs
   * @returns The index of the first word that is off screen
   */
  findOffScreenWord(wordsContainerRef: RefObject<HTMLDivElement>): number {
    // get the real word elements
    const words = Array.from(wordsContainerRef.current!.children).filter(element => element.tagName != "BR");

    for (const [wordIndex, word] of words.entries()) {
      if (word.getBoundingClientRect().bottom > window.innerHeight) {
        return wordIndex;
      }
    }

    return -1;
  }
}
