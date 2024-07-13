import { RefObject, useCallback, useEffect, useState } from "react";
import { BookText } from "../bookText";

const usePageSizing = (bookText: BookText, ref: RefObject<HTMLDivElement>) => {
  const [loadingPage, setLoadingPage] = useState(true);
  const [displayedWords, setDisplayedWords] = useState(bookText.getDisplayedWords());


  // ensure window has a full page of words, with no overflow
  const initWindow = useCallback(() => {
    if (
      loadingPage === false
      || ref.current === null
    ) return;

    const { displayedWords, stillLoading } = bookText.updateDisplay(ref);

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
  }, [initWindow, bookText, loadingPage, displayedWords]);

  return displayedWords;
};

export default usePageSizing;
