import { ForwardedRef, forwardRef, useEffect } from "react";
import { Optional } from "../options";
import styles from "./WordsContainer.module.scss";
import { BookText } from "../bookText";
import usePageSizing from "../hooks/usePageSizing";
import useForwardRef from "../hooks/useForwardRef";
const { wordsContainer, wordDiv, correctChar, incorrectChar, incorrectWord } = styles;

const WordsContainer = forwardRef((
  {
    bookText,
    typedChars,
  }: {
    bookText: BookText;
    typedChars: string[];
  }, ref: ForwardedRef<HTMLDivElement>
) => {
  const forwardRef = useForwardRef(ref);
  const text = bookText.getDisplayedWords().replaceAll("\n", "\n "); // usePageSizing(bookText, forwardRef);

  const lines = text.split("\n");
  const typedLines = typedChars.join("").split("\n");


  return (
    <div className={wordsContainer} ref={forwardRef}>
      {lines.map((line, index) => {
        const words = line.split(" ");
        const typedWords = Optional.some(typedLines[index]);

        return <Line key={index} words={words} typedWords={typedWords} />;
      })}
    </div>
  );
});

const Line = ({ words, typedWords }: { words: string[]; typedWords: Optional<string> }) => {
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

          if (typedWord.isSome()
            && typedWord.unwrap() !== word
            && index !== typedWordsSplit.unwrap().length - 1) {

            wordClass = incorrectWord;
          }
        }

        return <Word key={index} word={word} typedWord={typedWord} className={wordClass} />;
      })}
    </div>
  );
};

const Word = ({ word, typedWord, className }: { word: string; typedWord: Optional<string>; className: string }) => {
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

        return (
          <span key={index} className={charClass}>
            {character}
          </span>
        );
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
