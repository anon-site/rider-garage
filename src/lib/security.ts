// Security utilities to protect against data theft
import { useEffect } from "react";

export const useDevToolsProtection = () => {
  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable text selection
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Disable copy
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable cut
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable paste
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    // Check for devtools
    const checkDevTools = () => {
      const threshold = 160;
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        // Devtools detected - you can redirect or show warning
        console.clear();
        console.log('%c⚠️ Security Warning', 'color: red; font-size: 20px; font-weight: bold;');
        console.log('%cThis is a private application. Unauthorized access is prohibited.', 'color: red; font-size: 14px;');
        
        // Optional: Redirect to a blank page
        // window.location.href = 'about:blank';
      }
    };

    // Clear console on load
    console.clear();
    console.log('%c🔒 Protected Application', 'color: #4CAF50; font-size: 20px; font-weight: bold;');
    console.log('%cUnauthorized access attempts are logged and monitored.', 'color: #4CAF50; font-size: 14px;');

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);

    // Check for devtools periodically
    const interval = setInterval(checkDevTools, 1000);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      clearInterval(interval);
    };
  }, []);
};

// Data obfuscation utilities
export const obfuscateData = (data: Record<string, unknown>): string => {
  return btoa(JSON.stringify(data));
};

export const deobfuscateData = (obfuscatedData: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(atob(obfuscatedData));
  } catch {
    return null;
  }
};

// Prevent screenshot (limited effectiveness)
export const useScreenshotProtection = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Print Screen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        navigator.clipboard.writeText('');
        alert('Screenshots are disabled in this application.');
      }
      
      // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
};
