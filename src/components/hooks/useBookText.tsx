import { useState, useEffect } from "react";
import { Backend } from "../../backends/backends";
import { Settings } from "../SettingsProvider/Settings";
import { BookText } from "../bookText";
import { Optional } from "../options";

const useBookText = (backend: Backend, settings: Settings) => {
  const [bookText, setBookText] = useState(Optional.none<BookText>());

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
    })();
  }, [backend, settings]);

  return bookText;
};

export default useBookText;
