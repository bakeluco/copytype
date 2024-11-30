import { ForwardedRef, forwardRef } from "react";
import { Optional } from "../options";
import styles from "./WordsContainer.module.scss";
import { BookText } from "../bookText";
import usePageSizing from "../hooks/usePageSizing";
import useForwardRef from "../hooks/useForwardRef";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTurnDown } from "@fortawesome/free-solid-svg-icons";
import { useStore } from "../state/useStore";
const { wordsContainer, wordDiv, correctChar, incorrectChar, nlChar, incorrectWord } = styles;

const WordsContainer = forwardRef((
  {
    bookText,
  }: {
    bookText: BookText;
  }, ref: ForwardedRef<HTMLDivElement>
) => {
  const forwardRef = useForwardRef(ref);
  const { typedChars } = useStore();

  const typedWords = typedChars.join("").split(" ");

  const text = usePageSizing(bookText, forwardRef);
  const words = text.split(" ");

  return (
    <div className={wordsContainer} ref={forwardRef}>
      {words.map((word, index) => {
        const lastLetter = word[word.length - 1];

        let wordClass = "";
        if (isWordWrong(word, index, typedWords)) {
          wordClass = incorrectWord;
        }

        return (
          <>
            <Word key={index} word={word} typedWord={Optional.some(typedWords[index])} className={wordClass} />
            {lastLetter === "\n" && <br />}
          </>
        );
      })}
    </div>
  );
});

const isWordWrong = (word: string, index: number, typedWords: string[]): boolean => {
  const typedWord = Optional.some(typedWords[index]);
  return typedWord.isSome() && typedWord.unwrap() !== word && index !== typedWords.length - 1;
};

const Word = ({ word, typedWord, className }: { word: string; typedWord: Optional<string>; className?: string }) => {
  const characters = word.split("");
  let extraChars: string[] = [];

  let typedChars = Optional.none<string[]>();
  if (typedWord.isSome()) {
    typedChars = Optional.some(typedWord.unwrap().split(""));
    extraChars = typedChars.unwrap().slice(characters.length);
  }

  const classes = [wordDiv, className].join(" ");


  return (
    <div className={classes}>
      {characters.map((character, index) => {
        let charClass = "";
        if (typedChars.isSome()) {
          const typedChar = Optional.some(typedChars.unwrap()[index]);

          if (typedChar.isSome()) {
            charClass = typedChar.unwrap() === character ? correctChar : incorrectChar;
          }
        }

        if (character === "\n") {
          return <div className={charClass + " " + nlChar} key={index}>
            <FontAwesomeIcon icon={faTurnDown} transform={{ rotate: 90 }} />
          </div>;
        } else {
          return <span key={index} className={charClass}>
            {character}
          </span>;
        }
      })}

      {extraChars.map((char, index) => (
        <span key={index} className={incorrectChar}>
          {char}
        </span>
      ))}

    </div>
  );
};

export default WordsContainer;
