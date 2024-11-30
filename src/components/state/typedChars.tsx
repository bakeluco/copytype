import { StateCreator } from "zustand";

export interface TypedCharsSlice {
  typedChars: string[]
  setTypedChars: (newTypedChars: string[]) => void
}

export const createTypedCharsSlice: StateCreator<TypedCharsSlice> = (set) => ({
  typedChars: [],
  setTypedChars: (newTypedChars) => set(() => ({ typedChars: newTypedChars }))
});

