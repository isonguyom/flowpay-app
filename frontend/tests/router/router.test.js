import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import HomeView from '@/views/HomeView.vue'

describe('Router navigation guards', () => {
    let router
    let authStore

    beforeEach(() => {
        // Reset Pinia and create a fresh auth store
        setActivePinia(createPinia())
        authStore = useAuthStore()

        // Mock auth store methods
        authStore.isAuthenticated = vi.fn(() => false)
        authStore.fetchMe = vi.fn()
        authStore.logout = vi.fn()

        // Create a test router with memory history
        router = createRouter({
            history: createMemoryHistory(),
            routes: [
                { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: false } },
                { path: '/login', component: { template: '<div>Login</div>' }, meta: { guestOnly: true } },
                { path: '/dashboard', component: { template: '<div>Dashboard</div>' }, meta: { requiresAuth: true } },
                { path: '/register', component: { template: '<div>Register</div>' }, meta: { guestOnly: true } },
                { path: '/transactions', component: { template: '<div>Transactions</div>' }, meta: { requiresAuth: true } },
                { path: '/settings', component: { template: '<div>Settings</div>' }, meta: { requiresAuth: true } },
            ],
        })

        // Navigation guard same as app
        router.beforeEach(async (to, from, next) => {
            // Load user if token exists
            if (authStore.token && !authStore.user) {
                try {
                    await authStore.fetchMe()
                } catch {
                    authStore.logout()
                    return next('/login')
                }
            }

            const isAuthenticated = authStore.isAuthenticated()

            // Home route
            if (to.path === '/') {
                return next(isAuthenticated ? '/dashboard' : '/login')
            }

            // Protected routes
            if (to.meta.requiresAuth && !isAuthenticated) {
                return next({ path: '/login', query: { redirect: to.fullPath } })
            }

            // Guest-only routes
            if (to.meta.guestOnly && isAuthenticated) {
                return next('/dashboard')
            }

            next()
        })
    })

    it('redirects unauthenticated user to /login on protected route', async () => {
        authStore.isAuthenticated.mockReturnValue(false)
        await router.push('/dashboard')
        await router.isReady()
        expect(router.currentRoute.value.path).toBe('/login')
    })

    it('allows authenticated user to access protected route', async () => {
        authStore.isAuthenticated.mockReturnValue(true)
        await router.push('/dashboard')
        await router.isReady()
        expect(router.currentRoute.value.path).toBe('/dashboard')
    })

    it('redirects authenticated user from guest-only routes', async () => {
        authStore.isAuthenticated.mockReturnValue(true)
        await router.push('/login')
        await router.isReady()
        expect(router.currentRoute.value.path).toBe('/dashboard')
    })

    it('redirects home route based on auth', async () => {
        authStore.isAuthenticated.mockReturnValue(false)
        await router.push('/')
        await router.isReady()
        expect(router.currentRoute.value.path).toBe('/login')

        authStore.isAuthenticated.mockReturnValue(true)
        await router.push('/')
        await router.isReady()
        expect(router.currentRoute.value.path).toBe('/dashboard')
    })

    it('logs out and redirects to login if session fetch fails', async () => {
        // Simulate token but fetchMe throws
        authStore.token = 'mock-token'
        authStore.user = null
        authStore.fetchMe.mockRejectedValueOnce(new Error('Fetch failed'))
        authStore.isAuthenticated.mockReturnValue(false)

        // Use try/catch to prevent Vitest throwing due to navigation errors
        await router.push('/dashboard').catch(() => { })
        await router.isReady()

        expect(authStore.logout).toHaveBeenCalled()
        expect(router.currentRoute.value.path).toBe('/login')
    })
})
