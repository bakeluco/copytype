import { create } from "zustand";
import { TypedCharsSlice, createTypedCharsSlice } from "./typedChars";

export const useStore = create<TypedCharsSlice>()((...a) => ({
  ...createTypedCharsSlice(...a),
}));
