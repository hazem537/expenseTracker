const THEME_KEY = 'expense-tracker-theme'

export type ThemeMode = 'light' | 'dark'

function readTheme(): ThemeMode {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

let themeMode: ThemeMode = readTheme()
const listeners = new Set<() => void>()

function applyDom(mode: ThemeMode) {
  const root = document.documentElement
  root.classList.toggle('dark', mode === 'dark')
  root.style.colorScheme = mode
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', mode === 'dark' ? '#080b12' : '#0c1424')
}

applyDom(themeMode)

export function getTheme() {
  return themeMode
}

export function subscribeTheme(onStoreChange: () => void) {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}

export function setTheme(mode: ThemeMode) {
  themeMode = mode
  try {
    localStorage.setItem(THEME_KEY, mode)
  } catch {
    /* ignore */
  }
  applyDom(mode)
  listeners.forEach((listener) => listener())
}

export function toggleTheme() {
  setTheme(themeMode === 'dark' ? 'light' : 'dark')
}
