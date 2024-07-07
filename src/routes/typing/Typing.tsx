import {
  Ref,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { handleKeyPress, handleKeyDown } from "../../components/keypress";
import PageNavigators from "../../components/PageNavigators/PageNavigators";
import { useSettings } from "../../components/SettingsProvider/Settings";
import StatIndicators from "../../components/StatIndicators/StatIndicators";
import { useBackend } from "../../backends/BackendContext";
import { BookText } from "../../components/bookText";
import { Optional } from "../../components/options";
import Caret from "../../components/Caret/Caret";

import styles from "./Typing.module.scss";
const {
  wordsContainer,
  wordDiv,
  typingPage,
  correctChar,
  incorrectChar,
  incorrectWord,
} = styles;

export const Typing = () => {
  const { settings } = useSettings();
  const { backend } = useBackend();

  const [bookText, setBookText] = useState(Optional.none<BookText>());
  const [typedChars, setTypedChars] = useState<string[]>([]);

  const [loadingPage, setLoadingPage] = useState(true);
  const [displayedWords, setDisplayedWords] = useState("");
  const wordsContainerRef = useRef<HTMLDivElement>(null);

  // fetch the book and initialize its handler
  useEffect(() => {
    (async () => {
      if (settings.recentBooks[0] === undefined) return;

      console.log("Fetching book...");
      const fetchedBook = await backend.getBook(settings.recentBooks[0]);

      if (!fetchedBook.isSome()) {
        console.error("Failed to fetch book");
        return;
      }

      const content = fetchedBook.unwrap().chapters[0];
      const newText = new BookText(content, 0);

      setBookText(Optional.some(newText));
      setDisplayedWords(newText.getDisplayedWords());
    })();
  }, [backend, settings]);

  // ensure window has a full page of words, with no overflow
  const initWindow = useCallback(() => {
    if (wordsContainerRef.current === null) return;

    if (bookText.isNone() || loadingPage === false) return;

    const { displayedWords, stillLoading } = bookText
      .unwrap()
      .updateDisplay(wordsContainerRef);
    console.log(stillLoading);
    console.log(displayedWords);

    setLoadingPage(stillLoading);
    setDisplayedWords(displayedWords);
  }, [bookText, loadingPage, wordsContainerRef]);

  // initialize window and add resize listener
  useEffect(() => {
    const handleResize = () => {
      setLoadingPage(true);
      initWindow();
    };

    initWindow();

    // add resize listener
    window.addEventListener("resize", handleResize);

    // cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [initWindow]);

  // handle keypresses
  useEffect(() => {
    const keypress = (e: KeyboardEvent) =>
      handleKeyPress(e, typedChars, setTypedChars);
    const keydown = (e: KeyboardEvent) =>
      handleKeyDown(e, typedChars, setTypedChars);

    window.addEventListener("keypress", keypress);
    window.addEventListener("keydown", keydown);

    return () => {
      window.removeEventListener("keypress", keypress);
      window.removeEventListener("keydown", keydown);
    };
  }, [typedChars]);

  return (
    <div className={typingPage}>
      <PageNavigators />
      <StatIndicators />

      {bookText.isSome() && (
        <>
          <WordsContainer
            text={displayedWords}
            typedChars={typedChars}
            ref={wordsContainerRef}
          />
          <Caret
            wordsContainerRef={wordsContainerRef}
            typedChars={typedChars}
          />
        </>
      )}
    </div>
  );
};

const WordsContainer = forwardRef(
  (
    {
      text,
      typedChars,
    }: {
      text: string;
      typedChars: string[];
    },
    ref: Ref<HTMLDivElement>,
  ) => {
    const lines = text.split("\n");
    const typedLines = typedChars.join("").split("\n");

    return (
      <div className={wordsContainer} ref={ref}>
        {lines.map((line, index) => {
          const words = line.split(" ");
          const typedWords = Optional.some(typedLines[index]);

          return <Line key={index} words={words} typedWords={typedWords} />;
        })}
      </div>
    );
  },
);

const Line = ({
  words,
  typedWords,
}: {
  words: string[];
  typedWords: Optional<string>;
}) => {
  let typedWordsSplit = Optional.none<string[]>();
  if (typedWords.isSome()) {
    typedWordsSplit = Optional.some(typedWords.unwrap().split(" "));
  }

  return (
    <div>
      {words.map((word, index) => {
        let typedWord = Optional.none<string>();
        let wordClass = "";

        if (typedWordsSplit.isSome()) {
          typedWord = Optional.some(typedWordsSplit.unwrap()[index]);

          if (
            typedWord.isSome() &&
            index !== typedWordsSplit.unwrap().length - 1 &&
            typedWord.unwrap() !== word
          ) {
            wordClass = incorrectWord;
          }
        }

        return (
          <Word
            key={index}
            word={word}
            typedWord={typedWord}
            className={wordClass}
          />
        );
      })}
    </div>
  );
};

const Word = ({
  word,
  typedWord,
  className,
}: {
  word: string;
  typedWord: Optional<string>;
  className: string;
}) => {
  const characters = word.split("");

  let typedChars = Optional.none<string[]>();
  if (typedWord.isSome()) {
    typedChars = Optional.some(typedWord.unwrap().split(""));
  }

  const classes = [wordDiv, className].join(" ");

  return (
    <div className={classes}>
      {characters.map((character, index) => {
        let charClass = "";
        if (typedChars.isSome()) {
          const typedChar = Optional.some(typedChars.unwrap()[index]);

          if (typedChar.isSome()) {
            charClass =
              typedChar.unwrap() === character ? correctChar : incorrectChar;
          }
        }

        return (
          <span key={index} className={charClass}>
            {character}
          </span>
        );
      })}
    </div>
  );
};
