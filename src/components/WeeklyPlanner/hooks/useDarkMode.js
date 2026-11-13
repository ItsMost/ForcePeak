import { useEffect, useState } from 'react';

/** Theme preference. Keeps the existing localStorage key: forcepeak_theme. */
export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('forcepeak_theme');
    if (savedTheme !== null) return savedTheme === 'dark';
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('forcepeak_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return [isDarkMode, setIsDarkMode];
}
