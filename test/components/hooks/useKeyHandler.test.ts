import { expect, test } from "vitest";
import { deleteWord } from "../../../src/components/hooks/useKeyHandler";

const stringToTyped = (str: string): string[] => {
  return str.split("").map(char => char === "\n" ? "\n " : char);
};

test("deleteWord 'hello world'", () => {
  const typed = stringToTyped("hello world");

  const output = deleteWord(typed);
  const expected = stringToTyped("hello ");

  expect(output).toEqual(expected);
});

test("deleteWord 'hello\nworld'", () => {
  const typed = stringToTyped("hello\nworld");

  const output = deleteWord(typed);
  const expected = stringToTyped("hello\n");

  expect(output).toEqual(expected);
});

test("deleteWord 'hello\n  \n'", () => {
  const typed = stringToTyped("hello world\n  \n");

  const output = deleteWord(typed);
  const expected = stringToTyped("hello ");

  expect(output).toEqual(expected);
});

test("deleteWord ''", () => {
  const typed = stringToTyped("");
  const output = deleteWord(typed);
  const expected = stringToTyped("");
  expect(output).toEqual(expected);
});
