/**
 * useClipboard Hook
 * Copy and paste text operations
 */

import { useState, useEffect, useCallback } from 'react';
import Clipboard from '@react-native-clipboard/clipboard';

export interface ClipboardState {
  /** Current clipboard content */
  content: string;
  /** Has content been copied */
  hasCopied: boolean;
}

export interface UseClipboardOptions {
  /** Auto-read clipboard on mount */
  autoRead?: boolean;
  /** Reset hasCopied after timeout (ms) */
  resetTimeout?: number;
}

export interface UseClipboardReturn extends ClipboardState {
  /** Copy text to clipboard */
  copy: (text: string) => void;
  /** Read current clipboard content */
  read: () => Promise<string>;
  /** Clear clipboard */
  clear: () => void;
  /** Check if clipboard has content */
  hasContent: () => Promise<boolean>;
}

/**
 * Hook to manage clipboard operations
 */
export const useClipboard = (
  options: UseClipboardOptions = {},
): UseClipboardReturn => {
  const { autoRead = false, resetTimeout = 2000 } = options;

  const [state, setState] = useState<ClipboardState>({
    content: '',
    hasCopied: false,
  });

  // Auto-read on mount
  useEffect(() => {
    if (autoRead) {
      Clipboard.getString().then(content => {
        setState(prev => ({ ...prev, content }));
      });
    }
  }, [autoRead]);

  // Reset hasCopied after timeout
  useEffect(() => {
    if (state.hasCopied && resetTimeout > 0) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, hasCopied: false }));
      }, resetTimeout);

      return () => clearTimeout(timer);
    }
  }, [state.hasCopied, resetTimeout]);

  // Copy text to clipboard
  const copy = useCallback((text: string) => {
    Clipboard.setString(text);
    setState({ content: text, hasCopied: true });
  }, []);

  // Read clipboard content
  const read = useCallback(async (): Promise<string> => {
    const content = await Clipboard.getString();
    setState(prev => ({ ...prev, content }));
    return content;
  }, []);

  // Clear clipboard
  const clear = useCallback(() => {
    Clipboard.setString('');
    setState({ content: '', hasCopied: false });
  }, []);

  // Check if clipboard has content
  const hasContent = useCallback(async (): Promise<boolean> => {
    const content = await Clipboard.getString();
    return content.length > 0;
  }, []);

  return {
    ...state,
    copy,
    read,
    clear,
    hasContent,
  };
};

/**
 * Simple hook to copy text with feedback
 */
export const useCopyToClipboard = () => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback((text: string) => {
    Clipboard.setString(text);
    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  }, []);

  return { copy, copied };
};

export default useClipboard;
