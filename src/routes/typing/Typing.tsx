import { useRef } from "react";
import PageNavigators from "../../components/PageNavigators/PageNavigators";
import { useSettings } from "../../components/SettingsProvider/Settings";
import StatIndicators from "../../components/StatIndicators/StatIndicators";
import { useBackend } from "../../backends/BackendContext";
import Caret from "../../components/Caret/Caret";
import WordsContainer from "../../components/WordsContainer/WordsContainer";

import styles from "./Typing.module.scss";
import useBookText from "../../components/hooks/useBookText";
import useKeyHandler from "../../components/hooks/useKeyHandler";
const { typingPage } = styles;


export const Typing = () => {
  const { settings } = useSettings();
  const { backend } = useBackend();

  const wordsContainerRef = useRef<HTMLDivElement>(null);

  const bookText = useBookText(backend, settings);
  useKeyHandler();

  return (
    <div className={typingPage}>
      <PageNavigators />
      <StatIndicators />

      {bookText.isSome() && (
        <>
          <WordsContainer bookText={bookText.unwrap()} ref={wordsContainerRef} />
          <Caret wordsContainerRef={wordsContainerRef} />
        </>
      )}
    </div>
  );
};


