import { useState, useEffect } from "react";

const useKeyHandler = () => {
  const [typedChars, setTypedChars] = useState<string[]>([]);

  useEffect(() => {
    const keypress = (e: KeyboardEvent) => handleKeyPress(e, typedChars, setTypedChars);
    const keydown = (e: KeyboardEvent) => handleKeyDown(e, typedChars, setTypedChars);

    window.addEventListener("keypress", keypress);
    window.addEventListener("keydown", keydown);

    return () => {
      window.removeEventListener("keypress", keypress);
      window.removeEventListener("keydown", keydown);
    };
  }, [typedChars]);

  return typedChars;
};


export const handleKeyPress = (
  e: KeyboardEvent,
  typedChars: string[],
  setTypedChars: (typedChars: string[]) => void
) => {
  e.preventDefault();
  console.log(e);
  typedChars.push(e.key);

  console.log(typedChars.join(""));
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

      typedChars.push("\n");
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

const deleteWord = (typedChars: string[]) => {
  let seenChar = false;

  let i = typedChars.length - 1;
  while (i > 0 && (!seenChar || typedChars[i - 1] !== " ")) {
    if (typedChars[i] !== " ") {
      seenChar = true;
    }

    i--;
  }

  typedChars.splice(i);
  return typedChars;
};

export default useKeyHandler;
