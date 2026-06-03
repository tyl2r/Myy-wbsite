/**
 * Inlined in <head> before hydration to prevent a flash of the wrong theme.
 * Reads the saved preference, falling back to the system setting, and applies
 * the `dark` class synchronously.
 */
export const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('rs-theme');
    var system = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored ? stored === 'dark' : system;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
`;
