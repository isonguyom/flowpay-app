import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

// -----------------------------
// Mocks
// -----------------------------
vi.mock('@/composables/useUtils', () => ({
    useUtils: () => ({
        gotoRoute: vi.fn()
    })
}))

const resetStoreMock = vi.fn()

vi.mock('@/stores/auth', () => ({
    useAuthStore: () => ({
        resetStore: resetStoreMock
    })
}))

vi.mock('@/components/DarkModeToggle.vue', () => ({
    default: {
        template: '<div data-test="dark-toggle" />'
    }
}))

// -----------------------------
// Router helper
// -----------------------------
const createTestRouter = (initialPath) =>
    createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/login', component: { template: '<div />' } },
            { path: '/register', component: { template: '<div />' } }
        ]
    })

// -----------------------------
// Factory
// -----------------------------
const mountLayout = async (path = '/login') => {
    const router = createTestRouter(path)
    router.push(path)
    await router.isReady()

    return mount(AuthLayout, {
        global: {
            plugins: [router]
        },
        slots: {
            default: '<div>Slot Content</div>'
        }
    })
}

// -----------------------------
// Tests
// -----------------------------
describe('AuthLayout', () => {
    beforeEach(() => {
        resetStoreMock.mockClear()
    })

    it('renders brand, tabs and footer', async () => {
        const wrapper = await mountLayout()

        expect(wrapper.text()).toContain('FlowPay')
        expect(wrapper.text()).toContain('Login')
        expect(wrapper.text()).toContain('Register')
        expect(wrapper.find('[data-test="dark-toggle"]').exists()).toBe(true)
    })

    it('sets activeTab to login by default', async () => {
        const wrapper = await mountLayout('/login')
        await nextTick()

        expect(wrapper.vm.activeTab).toBe('login')
    })

    it('sets activeTab to register when route is /register', async () => {
        const wrapper = await mountLayout('/register')
        await nextTick()

        expect(wrapper.vm.activeTab).toBe('register')
    })

    it('switches tab and resets store when clicking Register', async () => {
        const wrapper = await mountLayout('/login')

        const registerBtn = wrapper.findAll('button')[1]
        await registerBtn.trigger('click')

        expect(wrapper.vm.activeTab).toBe('register')
        expect(resetStoreMock).toHaveBeenCalled()
    })

    it('switches tab and resets store when clicking Login', async () => {
        const wrapper = await mountLayout('/register')

        const loginBtn = wrapper.findAll('button')[0]
        await loginBtn.trigger('click')

        expect(wrapper.vm.activeTab).toBe('login')
        expect(resetStoreMock).toHaveBeenCalled()
    })
})
