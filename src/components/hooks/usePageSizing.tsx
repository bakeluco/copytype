import { RefObject, useCallback, useEffect, useState } from "react";
import { BookText } from "../bookText";
import { useStore } from "../state/useStore";
import { Optional } from "../options";

const usePageSizing = (bookText: Optional<BookText>, ref: RefObject<HTMLDivElement>) => {
  const [loadingPage, setLoadingPage] = useState(true);
  const [displayedText, setDisplayedWords] = useState("");
  const { typedChars, setTypedChars } = useStore();

  const wordsTyped = typedChars.join("").split(" ").length;

  // ensure window has a full page of words, with no overflow
  const initWindow = useCallback(() => {
    if (
      loadingPage === false
      || ref.current === null
      || bookText.isNone()
    ) return;

    const { displayedWords, stillLoading } = bookText.unwrap().updateDisplay(ref);

    setLoadingPage(stillLoading);
    setDisplayedWords(displayedWords.slice());
  }, [bookText, loadingPage, ref]);

  // initialize window and add resize listener
  useEffect(() => {
    const handleResize = () => {
      setLoadingPage(true);
      initWindow();
    };

    if (loadingPage) {
      initWindow();
    }

    // add resize listener
    window.addEventListener("resize", handleResize);

    // cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [initWindow, bookText, loadingPage, displayedText]);


  const nextPage = useCallback(() => {
    if (bookText.isNone()) {
      return;
    }

    bookText.unwrap().nextPage();
    setLoadingPage(true);
    setTypedChars([]);
  }, [bookText, setTypedChars]);

  // gets the next page of text if you've typed a whole page
  useEffect(() => {
    if (bookText.isNone()) {
      return;
    }

    const pageLength = bookText.unwrap().getDisplayedWords().split(" ").length;
    if (wordsTyped > pageLength) {
      nextPage();
    }
  }, [initWindow, bookText, wordsTyped, setTypedChars, nextPage]);

  return { displayedText, nextPage };
};

export default usePageSizing;
