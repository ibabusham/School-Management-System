/**
 * App-wide confirm dialog that replaces window.confirm.
 *
 * Wrap the tree with ConfirmProvider, then call:
 *   const confirmed = await confirm({ title, description })
 */
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";

export type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

type DialogState = {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setDialog({ options, resolve });
    });
  }, []);

  const close = useCallback(
    (result: boolean) => {
      dialog?.resolve(result);
      setDialog(null);
    },
    [dialog]
  );

  useEffect(() => {
    if (!dialog) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dialog, close]);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {dialog ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            aria-label="Cancel"
            onClick={() => close(false)}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-description"
            className="relative z-10 w-full max-w-md rounded-xl border border-border bg-surface p-6 text-center shadow-xl"
          >
            <h2
              id="confirm-title"
              className="text-lg font-extrabold text-foreground"
            >
              {dialog.options.title}
            </h2>
            <p
              id="confirm-description"
              className="mt-2 text-sm font-bold text-foreground-secondary"
            >
              {dialog.options.description}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="secondary" type="button" onClick={() => close(false)}>
                {dialog.options.cancelLabel ?? "Cancel"}
              </Button>
              <Button variant="danger" type="button" onClick={() => close(true)}>
                {dialog.options.confirmLabel ?? "Delete"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return confirm;
}
