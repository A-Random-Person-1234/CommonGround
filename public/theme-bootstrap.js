(() => {
  const storageKey = "cg-theme";
  const themeColors = Object.freeze({
    dark: "#101c31",
    light: "#f7f3ee"
  });
  const normalize = (value) => value === "light" ? "light" : "dark";
  const read = () => {
    try {
      return normalize(localStorage.getItem(storageKey));
    } catch {
      return "dark";
    }
  };
  const apply = (value, { persist = false } = {}) => {
    const theme = normalize(value);
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColors[theme]);
    if (persist) {
      try {
        localStorage.setItem(storageKey, theme);
      } catch {
        // The visible theme can still change when storage is unavailable.
      }
    }
    return theme;
  };

  window.CommonGroundTheme = Object.freeze({ apply, read });
  apply(read());

  window.addEventListener("storage", (event) => {
    if (event.key === storageKey) apply(event.newValue);
  });

  if (document.currentScript?.dataset.syncServer === "true") {
    window.addEventListener("DOMContentLoaded", async () => {
      try {
        const response = await fetch("/api/me", {
          credentials: "same-origin",
          headers: { Accept: "application/json" }
        });
        if (!response.ok) return;
        const data = await response.json();
        apply(data.theme, { persist: true });
      } catch {
        // The cached theme remains a safe fallback while offline.
      }
    }, { once: true });
  }
})();
