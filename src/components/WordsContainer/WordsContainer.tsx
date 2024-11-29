import { ForwardedRef, forwardRef, useEffect } from "react";
import { Optional } from "../options";
import styles from "./WordsContainer.module.scss";
import { BookText } from "../bookText";
import usePageSizing from "../hooks/usePageSizing";
import useForwardRef from "../hooks/useForwardRef";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown, faArrowTurnDown, faLevelDownAlt, faTurnDown } from "@fortawesome/free-solid-svg-icons";
const { wordsContainer, wordDiv, correctChar, incorrectChar, incorrectWord, nlChar } = styles;

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

  const text = usePageSizing(bookText, forwardRef);

  const words = text.split(" ");
  const typedWords = typedChars.join("").split(" ");

  return (
    <div className={wordsContainer} ref={forwardRef}>
      {words.map((word, index) => {
        const lastLetter = word[word.length - 1];
        return (
          <>
            <Word key={index} word={word} typedWord={Optional.some(typedWords[index])} />
            {lastLetter === "\n" && <br />}
          </>
        );
      })}
    </div>
  );
});

// const Line = ({ words, typedWords }: { words: string[]; typedWords: Optional<string> }) => {
//   let typedWordsSplit = Optional.none<string[]>();
//   if (typedWords.isSome()) {
//     typedWordsSplit = Optional.some(typedWords.unwrap().split(" "));
//   }
//
//
//   return (
//     <div>
//       {words.map((word, index) => {
//         let typedWord = Optional.none<string>();
//         let wordClass = "";
//
//         if (typedWordsSplit.isSome()) {
//           typedWord = Optional.some(typedWordsSplit.unwrap()[index]);
//
//           if (typedWord.isSome()
//             && typedWord.unwrap() !== word
//             && index !== typedWordsSplit.unwrap().length - 1) {
//
//             wordClass = incorrectWord;
//           }
//         }
//
//         return <Word key={index} word={word} typedWord={typedWord} className={wordClass} />;
//       })}
//     </div>
//   );
// };

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
