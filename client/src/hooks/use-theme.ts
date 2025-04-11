import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light" | "system";

interface ThemeStore {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

export const useTheme = create<ThemeStore>()(
    persist(
        (set) => ({
            theme: "system",
            setTheme: (theme) => {
                const root = window.document.documentElement;

                // Удаляем классы тем
                root.classList.remove("light", "dark");

                // Определяем какую тему применить
                if (theme === "system") {
                    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                        .matches
                        ? "dark"
                        : "light";
                    root.classList.add(systemTheme);
                } else {
                    root.classList.add(theme);
                }

                set({ theme });
            },
        }),
        {
            name: "theme-store",
        }
    )
);