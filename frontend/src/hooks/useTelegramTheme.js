import { useEffect } from 'react';

export const useTelegramTheme = () => {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    const root = document.documentElement;
    
    if (tg.colorScheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const params = tg.themeParams || {};
    if (params.button_color) root.style.setProperty('--color-primary', params.button_color);
    if (params.bg_color) root.style.setProperty('--color-surface', params.bg_color);
    if (params.secondary_bg_color) root.style.setProperty('--color-background', params.secondary_bg_color);
    if (params.text_color) root.style.setProperty('--color-dark', params.text_color);
    if (params.hint_color) root.style.setProperty('--color-gray', params.hint_color);

    tg.ready();
    tg.expand();
  }, []);
};
