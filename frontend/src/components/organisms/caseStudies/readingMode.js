import { createContext, useContext } from "react";
export const ReadingModeContext = createContext(null);
export const useReadingMode = () => useContext(ReadingModeContext);
