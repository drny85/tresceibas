export type ThemePref = "system" | "light" | "dark";
export const THEME_KEY = "tc-theme";

/**
 * Runs before the page paints: applies the saved choice (or the device
 * setting) to <html data-theme>, so there is no flash of the wrong theme.
 */
export const themeScript = `(function(){try{var k="${THEME_KEY}",m=window.matchMedia("(prefers-color-scheme: dark)");function a(){var p=localStorage.getItem(k)||"system";var d=p==="dark"||(p==="system"&&m.matches);document.documentElement.dataset.theme=d?"dark":"light";document.documentElement.style.colorScheme=d?"dark":"light"}a();m.addEventListener("change",a);window.__applyTheme=a}catch(e){}})();`;
