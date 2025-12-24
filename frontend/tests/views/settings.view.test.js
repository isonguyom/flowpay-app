import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import SettingsView from '@/views/SettingsView.vue'

// --------------------
// Mocks
// --------------------
const gotoRouteMock = vi.fn()

vi.mock('@/composables/useUtils', () => ({
    useUtils: () => ({
        gotoRoute: gotoRouteMock,
    }),
}))

vi.mock('@/composables/useValidators', () => ({
    useValidators: () => ({
        validateRequired: (v) => (!v ? 'Required' : null),
        validateEmail: () => null,
    }),
}))

vi.mock('@/stores/auth', () => ({
    useAuthStore: () => ({
        user: {
            name: 'John Doe',
            email: 'john@example.com',
            defaultCurrency: 'USD',
        },
        isAuthenticated: () => true,
        fetchMe: vi.fn(),
        updateProfile: vi.fn().mockResolvedValue(),
        logout: vi.fn().mockResolvedValue(),
    }),
}))

vi.mock('@/stores/fx', () => ({
    useFxStore: () => ({
        fetchFx: vi.fn(),
        fxList: [
            { label: 'USD', value: 'USD' },
            { label: 'EUR', value: 'EUR' },
        ],
        loading: false,
    }),
}))

// --------------------
// Mount helper
// --------------------
const mountView = () =>
    mount(SettingsView, {
        global: {
            plugins: [createPinia()],
            stubs: {
                AppLayout: { template: '<div><slot /></div>' },

                PageHeader: {
                    props: ['title', 'subtitle'],
                    template: `
            <header>
              <h1>{{ title }}</h1>
              <p>{{ subtitle }}</p>
            </header>
          `,
                },

                BaseInput: true,
                BaseSelect: true,
                BaseButton: true,
                DarkModeToggle: true,

                BaseToast: {
                    template: '<div />',
                    setup(_, { expose }) {
                        expose({ addToast: vi.fn() })
                    },
                },
            },
        },
    })

// --------------------
// Tests
// --------------------
describe('SettingsView', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        gotoRouteMock.mockClear()
    })

    it('renders settings page', () => {
        const wrapper = mountView()
        expect(wrapper.text()).toContain('Settings')
    })

    it('prefills form from auth user', () => {
        const wrapper = mountView()
        expect(wrapper.vm.settings.userName).toBe('John Doe')
        expect(wrapper.vm.settings.userEmail).toBe('john@example.com')
    })

    it('saves settings successfully', async () => {
        const wrapper = mountView()

        wrapper.vm.settings.userName = 'Jane Doe'
        await wrapper.vm.saveSettings()

        expect(wrapper.vm.savingSettings).toBe(false)
    })

    it('logs out and redirects to login', async () => {
        const wrapper = mountView()

        await wrapper.vm.logout()

        expect(gotoRouteMock).toHaveBeenCalledWith('/login')
        expect(wrapper.vm.loggingOut).toBe(false)
    })
})
