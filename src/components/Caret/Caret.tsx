import { CSSProperties, RefObject, useEffect, useRef, useState } from "react";
import styles from "./Caret.module.scss";
const { caret, animateCaret } = styles;

const Caret = ({
  typedChars,
  wordsContainerRef,
}: {
  typedChars: string[];
  wordsContainerRef: RefObject<HTMLDivElement>;
}) => {
  const [style, setStyle] = useState<CSSProperties>({
    transform: "translate(-999px, -999px)",
    display: "none"
  });
  const caretRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wordsContainerRef.current) return;
    if (!caretRef.current) return;

    const { left, top } = getCaretPosition(
      wordsContainerRef,
      caretRef,
      typedChars,
    );

    const style = {
      transform: `translate(${left}px, ${top}px)`,
    };

    setStyle(style);
  }, [wordsContainerRef, typedChars]);

  const caretClasses = [caret];

  if (typedChars === undefined || typedChars.length === 0) {
    caretClasses.push(animateCaret);
  }

  const classes = caretClasses.join(" ");

  return <div className={classes} style={style} ref={caretRef} />;
};

const getCaretPosition = (
  wordsContainerRef: RefObject<HTMLDivElement>,
  caretRef: RefObject<HTMLDivElement>,
  typedChars: string[],
): {
  left: number;
  top: number;
} => {

  // If either of the refs are not set, return a position that is offscreen.
  if (!wordsContainerRef.current || !caretRef.current) {
    return {
      left: -999,
      top: -999,
    };
  }

  const lines = Array.from(wordsContainerRef.current.children);


  // Return the position of a given letter element, with offsets provided
  const getPositionOfLetter = (letter: Element, caretWidth: number, endOfLetter = true) => {
    const { left, top, width } = letter.getBoundingClientRect();

    const offset = endOfLetter ? width : 0;

    return {
      left: left + offset - caretWidth,
      top,
    };
  };

  // Return the position of the last letter of the given line, word, or letter
  const getPositionOfLastLetter = ({
    line,
    word,
    letter,
    caretWidth
  }: {
    line?: Element,
    word?: Element,
    letter?: Element,
    caretWidth?: number,
  }) => {

    // defaults
    line = line || getLastElement(lines);
    word = word || getLastElement(Array.from(line.children));
    letter = letter || getLastElement(Array.from(word.children));
    caretWidth = caretWidth || caretRef.current!.getBoundingClientRect().width;

    return getPositionOfLetter(letter, caretWidth);
  };

  const typedLines = typedChars.join("").split("\n");
  const lastTypedLine = typedLines[typedLines.length - 1];
  const typedWords = lastTypedLine.split(" ");

  // Get the last line div that has been typed.
  const lastLineElement = lines[typedLines.length - 1];
  if (!lastLineElement) {
    return getPositionOfLastLetter({});
  }

  // Get the span of the last typed word.
  const lastWordElement = Array.from(lastLineElement.children)[typedWords.length - 1];
  if (!lastWordElement) {
    return getPositionOfLastLetter({ line: lastLineElement });
  }

  // Get the last typed word
  const lastTypedWord = getLastElement(typedWords);
  if (!lastTypedWord || lastTypedWord.length === 0) {
    const letter = Array.from(lastWordElement.children)[0];
    return getPositionOfLetter(letter, 0, false);
  }

  // Get the span of the last typed letter
  const lastLetterElement = Array.from(lastWordElement.children)[lastTypedWord.length - 1];
  if (!lastLetterElement) {
    return getPositionOfLastLetter({ word: lastWordElement, caretWidth: 0 });
  }

  // default: get the position of the last typed letter
  return getPositionOfLastLetter({ letter: lastLetterElement });
};

const getLastElement = <T,>(arr: { length: number;[key: number]: T }) => {
  return arr[arr.length - 1];
};


export default Caret;
