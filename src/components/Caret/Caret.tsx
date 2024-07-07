import { RefObject, useEffect, useRef, useState } from "react";
import styles from "./Caret.module.scss";
const { caret, animateCaret } = styles;

const Caret = ({
  typedChars,
  wordsContainerRef,
}: {
  typedChars: string[];
  wordsContainerRef: RefObject<HTMLDivElement>;
}) => {
  const [style, setStyle] = useState({
    transform: "translate(-999px, -999px)",
    "-webkit-transform": "translate(-999px, -999px)",
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
      "-webkit-transform": `translate(${left}px, ${top}px)`,
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
  if (!wordsContainerRef.current) {
    return {
      left: -999,
      top: -999,
    };
  }

  if (!caretRef.current) {
    return {
      left: -999,
      top: -999,
    };
  }

  const caretWidth = caretRef.current.getBoundingClientRect().width;

  const lines = Array.from(wordsContainerRef.current.children);

  const typedLines = typedChars.join("").split("\n");
  const lastTypedLines = typedLines[typedLines.length - 1];
  const typedWords = lastTypedLines.split(" ");

  const lastLineElement = lines[typedLines.length - 1];

  if (!lastLineElement) {
    const lastLine = getLastElement(lines);
    const lastWord = getLastElement(lastLine.children);
    const lastLetter = getLastElement(lastWord.children);

    const { left, top, width } = lastLetter.getBoundingClientRect();

    return {
      left: left + width - caretWidth,
      top,
    };
  }

  const lastWordElement = lastLineElement.children[typedWords.length - 1];

  if (!lastWordElement) {
    const lastWord = getLastElement(lastLineElement.children);
    const lastLetter = getLastElement(lastWord.children);

    const { left, top, width } = lastLetter.getBoundingClientRect();

    return {
      left: left + width - caretWidth,
      top: top + window.scrollY,
    };
  }

  const lastTypedWord = getLastElement(typedWords);
  const lastLetterElement = lastWordElement.children[lastTypedWord.length - 1];

  if (!lastTypedWord || lastTypedWord.length === 0) {
    const firstLetter = lastWordElement.children[0];

    const { left, top } = firstLetter.getBoundingClientRect();

    return {
      left,
      top: top + window.scrollY,
    };
  }

  if (!lastLetterElement) {
    const children = Array.from(lastWordElement.children);
    const letter = children[children.length - 1];
    console.log("letter", letter);
    const { left, top, width } = letter.getBoundingClientRect();
    return {
      left: left + width,
      top: top + window.scrollY,
    };
  }

  const { left, top, width } = lastLetterElement.getBoundingClientRect();

  return {
    left: left + width - caretWidth,
    top: top + window.scrollY,
  };
};

const getLastElement = <T,>(arr: { length: number; [key: number]: T }) =>
  arr[arr.length - 1];

export default Caret;
