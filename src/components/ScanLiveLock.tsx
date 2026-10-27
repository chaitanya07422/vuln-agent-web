"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ScanLiveLockContext = createContext(false);

export function ScanLiveLockProvider({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const value = useMemo(() => locked, [locked]);
  return (
    <ScanLiveLockContext.Provider value={value}>
      <ScanLiveLockSetterContext.Provider value={setLocked}>
        {children}
      </ScanLiveLockSetterContext.Provider>
    </ScanLiveLockContext.Provider>
  );
}

const ScanLiveLockSetterContext = createContext<(locked: boolean) => void>(() => {});

/** Call from the live scan page: locks site chrome until the scan finishes. */
export function useSetScanLiveLock(locked: boolean) {
  const setLocked = useContext(ScanLiveLockSetterContext);
  useEffect(() => {
    setLocked(locked);
    return () => setLocked(false);
  }, [locked, setLocked]);
}

export function useScanLiveLock() {
  return useContext(ScanLiveLockContext);
}
