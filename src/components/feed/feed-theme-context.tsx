"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Single dark theme matching dashboard (BANKGO). No theme selector. */
const FEED_THEME_ID = "dark" as const;

type FeedThemeContextType = {
  theme: typeof FEED_THEME_ID;
};

const FeedThemeContext = createContext<FeedThemeContextType>({
  theme: FEED_THEME_ID,
});

export function FeedThemeProvider({ children }: { children: ReactNode }) {
  return (
    <FeedThemeContext.Provider value={{ theme: FEED_THEME_ID }}>
      <div data-feed-theme={FEED_THEME_ID} className="ft-bg min-h-screen">
        {children}
      </div>
    </FeedThemeContext.Provider>
  );
}

export function useFeedTheme() {
  return useContext(FeedThemeContext);
}
