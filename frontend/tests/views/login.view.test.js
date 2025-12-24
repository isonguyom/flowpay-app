import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import LoginView from '@/views/LoginView.vue'
import { useAuthStore } from '@/stores/auth'

describe('LoginView', () => {
    let wrapper
    let authStore

    const router = createRouter({
        history: createWebHistory(),
        routes: [{ path: '/', component: { template: '<div />' } }]
    })

    beforeEach(async () => {
        vi.useFakeTimers()

        wrapper = mount(LoginView, {
            global: {
                plugins: [
                    createTestingPinia({
                        createSpy: vi.fn,
                        initialState: {
                            auth: {
                                error: null,
                                loading: false
                            }
                        }
                    }),
                    router
                ],
                stubs: {
                    AuthLayout: {
                        template: '<div><slot /></div>'
                    },
                    BaseInput: {
                        props: ['modelValue', 'error'],
                        emits: ['update:modelValue'],
                        template: `
              <input
                :value="modelValue"
                @input="$emit('update:modelValue', $event.target.value)"
              />
            `
                    },
                    BaseButton: {
                        template: '<button><slot /></button>'
                    }
                }
            }
        })

        authStore = useAuthStore()
        await router.isReady()
    })

    afterEach(() => {
        vi.runOnlyPendingTimers()
        vi.useRealTimers()
    })

    it('renders form fields and button', () => {
        const inputs = wrapper.findAll('input')
        expect(inputs.length).toBe(2)
        expect(wrapper.find('button').exists()).toBe(true)
    })

    it('validates fields with debounce', async () => {
        const inputs = wrapper.findAll('input')

        // Force change so watcher triggers
        await inputs[0].setValue('x')
        await inputs[1].setValue('x')

        await inputs[0].setValue('')
        await inputs[1].setValue('')

        vi.advanceTimersByTime(300)
        await nextTick()

        expect(wrapper.vm.errors.email).toBe('Email is required')
        expect(wrapper.vm.errors.password).toBe('Password is required')
    })


    it('submits the form when valid', async () => {
        authStore.login.mockResolvedValue(true)

        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('test@example.com')
        await inputs[1].setValue('password123')

        vi.advanceTimersByTime(300)
        await nextTick()

        await wrapper.find('form').trigger('submit.prevent')

        expect(authStore.login).toHaveBeenCalledWith(
            'test@example.com',
            'password123'
        )
    })

    it('does not submit if validation fails', async () => {
        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('')
        await inputs[1].setValue('')

        vi.advanceTimersByTime(300)
        await nextTick()

        await wrapper.find('form').trigger('submit.prevent')

        expect(authStore.login).not.toHaveBeenCalled()
    })

    it('displays API error from authStore', async () => {
        authStore.error = 'Invalid credentials'
        await nextTick()

        expect(wrapper.text()).toContain('Invalid credentials')
    })
})
