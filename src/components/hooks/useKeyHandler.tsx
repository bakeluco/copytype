import { useEffect } from "react";
import { useStore } from "../state/useStore";

const useKeyHandler = () => {
  const { typedChars, setTypedChars } = useStore();

  useEffect(() => {
    const keypress = (e: KeyboardEvent) => handleKeyPress(e, typedChars, setTypedChars);
    const keydown = (e: KeyboardEvent) => handleKeyDown(e, typedChars, setTypedChars);

    window.addEventListener("keypress", keypress);
    window.addEventListener("keydown", keydown);

    return () => {
      window.removeEventListener("keypress", keypress);
      window.removeEventListener("keydown", keydown);
    };
  }, [typedChars, setTypedChars]);
};


export const handleKeyPress = (
  e: KeyboardEvent,
  typedChars: string[],
  setTypedChars: (typedChars: string[]) => void
) => {
  e.preventDefault();
  typedChars.push(e.key);

  setTypedChars([...typedChars]);
};

export const handleKeyDown = (
  e: KeyboardEvent,
  typedChars: string[],
  setTypedChars: (typedChars: string[]) => void
) => {
  switch (e.key) {
    case "Backspace": {
      e.preventDefault();

      if (isDeletingWord(e)) {
        typedChars = deleteWord(typedChars);
      } else {
        typedChars.pop();
      }

      setTypedChars([...typedChars]);
      break;
    }
    case "Escape": {
      e.preventDefault();
      break;
    }
    case "Enter": {
      e.preventDefault();

      typedChars.push("\n ");
      setTypedChars([...typedChars]);
    }
  }
};

const isDeletingWord = (e: KeyboardEvent) => {
  if (window.navigator.platform.includes("Mac")) {
    return e.altKey;
  } else {
    return e.ctrlKey;
  }
};

export const deleteWord = (typedChars: string[]) => {
  let i = typedChars.length - 1;
  let seenChar = false;

  while (i >= 0) {
    const currentChar = typedChars[i];
    const isWhitespace = currentChar === " " || currentChar === "\n ";

    if (seenChar && isWhitespace) {
      break;
    }

    if (!isWhitespace) {
      seenChar = true;
    }

    i--;
  }

  typedChars.splice(i + 1);
  return typedChars;
};

export default useKeyHandler;
