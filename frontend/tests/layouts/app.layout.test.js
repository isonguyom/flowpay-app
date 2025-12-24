import { describe, it, expect, beforeAll, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'

// ------------------------
// Mocks
// ------------------------
beforeAll(() => {
    // jsdom doesn't implement scrollIntoView
    Element.prototype.scrollIntoView = vi.fn()
})

// Dummy pages for router
const DummyPage = { template: '<div>Page</div>' }

const routes = [
    { path: '/dashboard', component: DummyPage, meta: { title: 'Dashboard' } },
    { path: '/payment', component: DummyPage, meta: { title: 'Payment' } },
    { path: '/transactions', component: DummyPage, meta: { title: 'Transactions' } },
    { path: '/settings', component: DummyPage, meta: { title: 'Settings' } },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// ------------------------
// Tests
// ------------------------
describe('AppLayout.vue', () => {
    it('renders slot content', async () => {
        const wrapper = mount(AppLayout, {
            global: { plugins: [createTestingPinia(), router] },
            slots: { default: '<p>Slot Content</p>' },
        })

        await router.isReady()
        expect(wrapper.text()).toContain('Slot Content')
    })

    it('displays user info from auth store', async () => {
        const pinia = createTestingPinia({ stubActions: false })
        const authStore = useAuthStore(pinia)
        authStore.user = { name: 'John Doe', email: 'john@example.com' }

        const wrapper = mount(AppLayout, {
            global: { plugins: [pinia, router] },
        })

        await router.isReady()
        // Avatar initial
        expect(wrapper.text()).toContain('J')
        // Name and email
        expect(wrapper.text()).toContain('John Doe')
        expect(wrapper.text()).toContain('john@example.com')
    })

    it('highlights the active nav item', async () => {
        await router.push('/payment')
        const wrapper = mount(AppLayout, {
            global: { plugins: [createTestingPinia(), router] },
        })
        await router.isReady()

        const activeLink = wrapper.find('a[aria-current="page"]')
        expect(activeLink.exists()).toBe(true)
        expect(activeLink.text()).toBe('Payment')
    })

    it('updates active nav when route changes', async () => {
        const wrapper = mount(AppLayout, {
            global: { plugins: [createTestingPinia(), router] },
        })
        await router.isReady()

        // Initially dashboard
        await router.push('/dashboard')
        await wrapper.vm.$nextTick()
        let activeLink = wrapper.find('a[aria-current="page"]')
        expect(activeLink.text()).toBe('Dashboard')

        // Change route
        await router.push('/payment')
        await wrapper.vm.$nextTick()
        activeLink = wrapper.find('a[aria-current="page"]')
        expect(activeLink.text()).toBe('Payment')
    })

    it('nav is scrollable on small screens', async () => {
        const wrapper = mount(AppLayout, {
            attachTo: document.body, // needed for scroll
            global: { plugins: [createTestingPinia(), router] },
        })
        await router.isReady()
        const nav = wrapper.find('nav')
        expect(nav.classes()).toContain('overflow-x-auto')
    })

    it('calls scrollIntoView for active nav on route change', async () => {
        const wrapper = mount(AppLayout, {
            global: { plugins: [createTestingPinia(), router] },
        })
        await router.push('/transactions')
        await wrapper.vm.$nextTick()

        // Ensure scrollIntoView was called
        expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
    })
})
