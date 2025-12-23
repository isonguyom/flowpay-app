import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

vi.mock('@/services/api')

describe('Auth Store', () => {
    let store

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useAuthStore()
        localStorage.clear()
    })

    it('initializes with correct default state', () => {
        expect(store.user).toBeNull()
        expect(store.token).toBeNull()
        expect(store.wallets).toEqual([])
        expect(store.loading).toBe(false)
        expect(store.error).toBeNull()
    })

    it('register sets user, token, and wallets', async () => {
        api.post.mockResolvedValue({
            data: {
                user: { id: 1, name: 'Alice' },
                token: 'abc123',
                wallet: { id: 1, balance: 100 },
            },
        })

        const result = await store.register({
            name: 'Alice',
            email: 'alice@test.com',
            password: 'pass123',
        })

        expect(result).toBe(true)
        expect(store.user).toEqual({ id: 1, name: 'Alice' })
        expect(store.token).toBe('abc123')
        expect(store.wallets).toEqual([{ id: 1, balance: 100 }])
    })

    it('login sets user and token, fetches wallets', async () => {
        api.post.mockResolvedValue({ data: { user: { id: 1 }, token: 'abc123' } })
        api.get.mockResolvedValue({ data: { wallets: [{ id: 1 }] } })

        const result = await store.login({ email: 'test@test.com', password: 'pass' })

        expect(result).toBe(true)
        expect(store.user).toEqual({ id: 1 })
        expect(store.token).toBe('abc123')
        expect(store.wallets).toEqual([{ id: 1 }])
    })

    it('fetchMe updates user and wallets', async () => {
        store.token = 'abc123'
        api.get.mockResolvedValueOnce({ data: { id: 1, name: 'Alice' } })
        api.get.mockResolvedValueOnce({ data: { wallets: [{ id: 1 }] } })

        await store.fetchMe()

        expect(store.user).toEqual({ id: 1, name: 'Alice' })
        expect(store.wallets).toEqual([{ id: 1 }])
    })

    it('updateProfile updates user', async () => {
        store.token = 'abc123'
        api.put.mockResolvedValue({ data: { user: { id: 1, name: 'Bob' } } })

        const result = await store.updateProfile({ name: 'Bob' })

        expect(result).toBe(true)
        expect(store.user).toEqual({ id: 1, name: 'Bob' })
    })

    it('logout clears all state and localStorage', async () => {
        store.user = { id: 1 }
        store.token = 'abc123'
        store.wallets = [{ id: 1 }]
        localStorage.setItem('user', JSON.stringify(store.user))
        localStorage.setItem('token', store.token)
        localStorage.setItem('wallets', JSON.stringify(store.wallets))

        await store.logout()

        expect(store.user).toBeNull()
        expect(store.token).toBeNull()
        expect(store.wallets).toEqual([])
        expect(localStorage.getItem('user')).toBeNull()
        expect(localStorage.getItem('token')).toBeNull()
        expect(localStorage.getItem('wallets')).toBeNull()
    })

    it('isAuthenticated returns true when user and token exist', () => {
        store.user = { id: 1 }
        store.token = 'abc123'
        expect(store.isAuthenticated()).toBe(true)
    })

    it('isAuthenticated returns false when no user or token', () => {
        store.user = null
        store.token = null
        expect(store.isAuthenticated()).toBe(false)
    })
})
