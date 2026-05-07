import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@/api/system";
import { useScanner } from "@/scanner/ScannerProvider";

export const TopBar = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const { scannerActive, setScannerActive, submitScan } = useScanner();
  const health = useQuery({ queryKey: ["system", "health"], queryFn: getHealth, refetchInterval: 15000, retry: 0 });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const restoreFocus = () => {
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <header className="topbar" onPointerUp={restoreFocus}>
      <form
        className="scanner-form"
        onSubmit={(event) => {
          event.preventDefault();
          submitScan(value);
          setValue("");
          restoreFocus();
        }}
      >
        <span className="scanner-form__icon">[]</span>
        <input
          ref={inputRef}
          className="scanner-form__input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => setScannerActive(true)}
          onBlur={() => setScannerActive(false)}
          placeholder="Scannen oder suchen ..."
          aria-label="Scannen oder suchen"
        />
      </form>
      <div className="status-pill">
        <span className={`status-dot ${scannerActive ? "is-ok" : "is-warn"}`} />
        Scanner: {scannerActive ? "aktiv" : "inaktiv"}
      </div>
      <div className="status-pill">
        API: {health.data?.ok ? "online" : health.isLoading ? "prüfen" : "offline"}
        <span className={`status-dot ${health.data?.ok ? "is-ok" : "is-warn"}`} />
      </div>
    </header>
  );
};
