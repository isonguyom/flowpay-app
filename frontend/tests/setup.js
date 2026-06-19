import { vi } from 'vitest'
import '@testing-library/jest-dom'

/**
 * -----------------------------
 * Browser API MOCKS (CRITICAL)
 * -----------------------------
 */

// localStorage mock
const storageMock = () => {
  let store = {}

  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
}

globalThis.localStorage = storageMock()
globalThis.sessionStorage = storageMock()

/**
 * -----------------------------
 * DOM API FIXES
 * -----------------------------
 */

// scroll APIs
globalThis.scrollTo = vi.fn()
Element.prototype.scrollIntoView = vi.fn()

// matchMedia (common Vue UI requirement)
globalThis.matchMedia = vi.fn(() => ({
  matches: false,
  addListener: vi.fn(),
  removeListener: vi.fn(),
}))