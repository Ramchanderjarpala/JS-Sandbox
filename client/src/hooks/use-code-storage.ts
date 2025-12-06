import { useState, useEffect } from "react";
import { defaultCode } from "../shared/schema";

const STORAGE_KEY = "js-playground-code";

export function useCodeStorage() {
  const [code, setCode] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored || defaultCode;
    }
    return defaultCode;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, code);
  }, [code]);

  const resetCode = () => {
    setCode(defaultCode);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { code, setCode, resetCode };
}