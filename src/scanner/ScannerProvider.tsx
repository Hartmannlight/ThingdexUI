import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { parseScan } from "@/scanner/scanParser";
import type { ScanEvent } from "@/scanner/types";

type ScannerContextValue = {
  scannerActive: boolean;
  lastScan: ScanEvent | null;
  submitScan: (raw: string) => void;
  setScannerActive: (active: boolean) => void;
};

const ScannerContext = createContext<ScannerContextValue | null>(null);

export const ScannerProvider = ({ children }: { children: ReactNode }) => {
  const [lastScan, setLastScan] = useState<ScanEvent | null>(null);
  const [scannerActive, setScannerActive] = useState(true);

  const submitScan = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    setLastScan((current) => ({
      id: (current?.id ?? 0) + 1,
      raw: trimmed,
      parsed: parseScan(trimmed),
      at: new Date()
    }));
  }, []);

  const value = useMemo(
    () => ({ scannerActive, lastScan, submitScan, setScannerActive }),
    [lastScan, scannerActive, submitScan]
  );

  return <ScannerContext.Provider value={value}>{children}</ScannerContext.Provider>;
};

export const useScanner = () => {
  const context = useContext(ScannerContext);
  if (!context) throw new Error("useScanner must be used within ScannerProvider");
  return context;
};
