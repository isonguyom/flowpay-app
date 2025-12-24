import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import RegisterView from '@/views/RegisterView.vue'
import { createRouter, createWebHistory } from 'vue-router'

describe('RegisterView', () => {
    let wrapper
    let authStore
    let router

    beforeAll(() => {
        // Enable fake timers for debounce
        vi.useFakeTimers()
    })

    afterAll(() => {
        vi.useRealTimers()
    })

    beforeEach(async () => {
        router = createRouter({
            history: createWebHistory(),
            routes: [{ path: '/dashboard', name: 'Dashboard' }],
        })

        wrapper = mount(RegisterView, {
            global: {
                plugins: [createTestingPinia({ createSpy: vi.fn }), router],
                stubs: {
                    AuthLayout: { template: '<div><slot /></div>' },
                    BaseInput: {
                        props: ['modelValue', 'error', 'hint'],
                        template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
                    },
                    BaseButton: {
                        props: ['loading'],
                        template: '<button><slot /></button>',
                    },
                },
            },
        })

        authStore = wrapper.vm.authStore
        await router.isReady()
    })

    afterEach(() => {
        vi.clearAllTimers()
    })

    it('renders form fields and button', () => {
        const inputs = wrapper.findAll('input')
        expect(inputs.length).toBe(3)
        expect(wrapper.find('button').exists()).toBe(true)
    })

    it('validates fields on blur with debounce', async () => {
        vi.useFakeTimers()

        const nameInput = wrapper.find('#register-name')
        const emailInput = wrapper.find('#register-email')
        const passwordInput = wrapper.find('#register-password')

        // Set a value first, then clear it to trigger the watcher
        await nameInput.setValue('John Doe')
        await nameInput.setValue('')
        await nameInput.trigger('blur') // trigger immediate validation

        // Email and password for debounce validation
        await emailInput.setValue('invalid')
        await passwordInput.setValue('123')

        // Advance timers for debounced validation
        vi.advanceTimersByTime(300)
        await wrapper.vm.$nextTick()

        // Assertions
        expect(wrapper.vm.errors.name).toBe('Name is required')
        expect(wrapper.vm.errors.email).toBe('Email is invalid')
        expect(wrapper.vm.errors.password).toBe('Password must be at least 8 characters')

        vi.useRealTimers()
    })





    it('submits the form when valid', async () => {
        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('John Doe')
        await inputs[1].setValue('john@example.com')
        await inputs[2].setValue('12345678')

        authStore.register.mockResolvedValue(true)
        await wrapper.find('form').trigger('submit.prevent')

        expect(authStore.register).toHaveBeenCalledWith('John Doe', 'john@example.com', '12345678')
    })

    it('does not submit if validation fails', async () => {
        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('') // invalid name
        await inputs[1].setValue('invalid') // invalid email
        await inputs[2].setValue('123') // invalid password

        await wrapper.find('form').trigger('submit.prevent')

        expect(authStore.register).not.toHaveBeenCalled()
        expect(wrapper.vm.errors.name).toBe('Name is required')
        expect(wrapper.vm.errors.email).toBe('Email is invalid')
        expect(wrapper.vm.errors.password).toBe('Password must be at least 8 characters')
    })

    it('displays API error from authStore', async () => {
        authStore.error = 'Email already taken'
        await wrapper.vm.$nextTick()

        const errorEl = wrapper.find('p')
        expect(errorEl.exists()).toBe(true)
        expect(errorEl.text()).toBe('Email already taken')
    })
})
