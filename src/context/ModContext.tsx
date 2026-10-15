'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { verifyModPasscode } from '@/actions/admin';

interface ModContextType {
  isMod: boolean;
  modPasscode: string | null;
  isModModalOpen: boolean;
  editingPost: { id: string; body: string } | null;
  openModModal: () => void;
  closeModModal: () => void;
  setEditingPost: (post: { id: string; body: string } | null) => void;
  unlockMod: (passcode: string) => Promise<{ success: boolean; error?: string }>;
  lockMod: () => void;
}

const ModContext = createContext<ModContextType>({
  isMod: false,
  modPasscode: null,
  isModModalOpen: false,
  editingPost: null,
  openModModal: () => {},
  closeModModal: () => {},
  setEditingPost: () => {},
  unlockMod: async () => ({ success: false }),
  lockMod: () => {},
});

const STORAGE_KEY = 'rgpv_mod_passcode';

export function ModProvider({ children }: { children: ReactNode }) {
  const [modPasscode, setModPasscode] = useState<string | null>(null);
  const [isMod, setIsMod] = useState(false);
  const [isModModalOpen, setIsModModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<{ id: string; body: string } | null>(null);

  // Restore stored passcode on client load
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        verifyModPasscode(stored).then((res) => {
          if (res.success) {
            setModPasscode(stored);
            setIsMod(true);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        });
      }
    } catch {
      // Storage access blocked or unavailable
    }
  }, []);

  const unlockMod = useCallback(async (passcode: string) => {
    const res = await verifyModPasscode(passcode);
    if (res.success) {
      setModPasscode(passcode);
      setIsMod(true);
      try {
        localStorage.setItem(STORAGE_KEY, passcode);
      } catch {}
      return { success: true };
    }
    return { success: false, error: res.error || 'Invalid passcode' };
  }, []);

  const lockMod = useCallback(() => {
    setModPasscode(null);
    setIsMod(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const openModModal = useCallback(() => setIsModModalOpen(true), []);
  const closeModModal = useCallback(() => setIsModModalOpen(false), []);

  return (
    <ModContext.Provider
      value={{
        isMod,
        modPasscode,
        isModModalOpen,
        editingPost,
        openModModal,
        closeModModal,
        setEditingPost,
        unlockMod,
        lockMod,
      }}
    >
      {children}
    </ModContext.Provider>
  );
}

export function useMod() {
  const context = useContext(ModContext);
  if (!context) {
    throw new Error('useMod must be used within a ModProvider');
  }
  return context;
}
