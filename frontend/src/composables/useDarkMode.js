import { ref, onMounted, onUnmounted } from 'vue'

export function useDarkMode() {
  const isDark = ref(false)

  /** Apply theme to <html> */
  const applyTheme = (theme) => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      isDark.value = true
    } else {
      root.classList.remove('dark')
      isDark.value = false
    }
  }

  /** Sync from localStorage → system → default */
  const syncDarkMode = () => {
    const storedTheme = localStorage.getItem('theme')
    const systemPref = window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme(storedTheme || (systemPref ? 'dark' : 'light'))
  }

  /** Manual toggle */
  const toggleDarkMode = () => {
    const newTheme = isDark.value ? 'light' : 'dark'
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  /** Auto-respond to OS theme change */
  const handleSystemChange = (event) => {
    if (!localStorage.getItem('theme')) {
      applyTheme(event.matches ? 'dark' : 'light')
    }
  }

  /** Sync theme changes across tabs */
  const handleStorageChange = (event) => {
    if (event.key === 'theme') syncDarkMode()
  }

  // --- Lifecycle ---
  let mediaQuery
  let observer

  onMounted(() => {
    syncDarkMode()

    const root = document.documentElement

    // Watch class changes on <html>
    observer = new MutationObserver(() => {
      isDark.value = root.classList.contains('dark')
    })

    observer.observe(root, { attributes: true, attributeFilter: ['class'] })

    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', handleSystemChange)

    window.addEventListener('storage', handleStorageChange)
  })

  onUnmounted(() => {
    observer?.disconnect()
    mediaQuery?.removeEventListener('change', handleSystemChange)
    window.removeEventListener('storage', handleStorageChange)
  })


  return {
    isDark,
    toggleDarkMode,
    syncDarkMode,
  }
}
