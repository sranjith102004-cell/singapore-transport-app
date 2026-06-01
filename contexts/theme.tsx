import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance } from 'react-native';

type ThemePreference = 'dark' | 'light' | 'system';

type ThemeContextValue = {
  theme: ThemePreference;
  isLight: boolean;
  saveTheme: (selectedTheme: ThemePreference) => Promise<void>;
};

const THEME_KEY = 'app_theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

const isThemePreference = (value: string | null): value is ThemePreference =>
  value === 'dark' || value === 'light' || value === 'system';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemePreference>('system');
  const [systemTheme, setSystemTheme] = useState(Appearance.getColorScheme());

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((savedTheme) => {
      if (isThemePreference(savedTheme)) setTheme(savedTheme);
    });

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const saveTheme = useCallback(async (selectedTheme: ThemePreference) => {
    setTheme(selectedTheme);
    await AsyncStorage.setItem(THEME_KEY, selectedTheme);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isLight: theme === 'light' || (theme === 'system' && systemTheme === 'light'),
      saveTheme,
    }),
    [saveTheme, systemTheme, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useAppTheme must be used within ThemeProvider');

  return value;
}

export type { ThemePreference };
