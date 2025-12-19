import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import { useHelpers } from '@/composables/useHelpers'

export const useAuthStore = defineStore('auth', () => {
    const { simulateDelay } = useHelpers()

    // ------------------------
    // State
    // ------------------------
    const user = ref(JSON.parse(localStorage.getItem('user')) || null)
    const token = ref(localStorage.getItem('token') || null)
    const loading = ref(false)
    const error = ref(null)

    // ------------------------
    // Register
    // ------------------------
    const register = async (name, email, password, defaultCurrency = 'USD') => {
        loading.value = true
        error.value = null
        try {
            await simulateDelay()

            const res = await api.post('/auth/register', {
                name,
                email,
                password,
                defaultCurrency,
            })

            user.value = res.data.user
            token.value = res.data.token

            localStorage.setItem('user', JSON.stringify(user.value))
            localStorage.setItem('token', token.value)
            return true
        } catch (err) {
            console.error('Register error:', err)
            error.value = err.response?.data?.message || 'Registration failed'
            return false
        } finally {
            loading.value = false
        }
    }

    // ------------------------
    // Login
    // ------------------------
    const login = async (email, password) => {
        loading.value = true
        error.value = null
        try {
            await simulateDelay()

            const res = await api.post('/auth/login', { email, password })

            user.value = res.data.user
            token.value = res.data.token

            localStorage.setItem('user', JSON.stringify(user.value))
            localStorage.setItem('token', token.value)
            return true
        } catch (err) {
            console.error('Login error:', err)
            error.value = err.response?.data?.message || 'Login failed'
            return false
        } finally {
            loading.value = false
        }
    }

    // ------------------------
    // Fetch current user
    // ------------------------
    const fetchMe = async () => {
        if (!token.value) return
        loading.value = true
        error.value = null
        try {
            await simulateDelay(500)
            const res = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${token.value}` },
            })
            user.value = res.data
            localStorage.setItem('user', JSON.stringify(res.data))
        } catch (err) {
            console.error('Fetch profile error:', err)
            logout()
        } finally {
            loading.value = false
        }
    }

    // ------------------------
    // Update profile
    // ------------------------
    const updateProfile = async (payload) => {
        if (!token.value) return false
        loading.value = true
        error.value = null
        try {
            await simulateDelay()
            const res = await api.put('/auth/me', payload, {
                headers: { Authorization: `Bearer ${token.value}` },
            })
            user.value = res.data.user
            localStorage.setItem('user', JSON.stringify(user.value))
            return true
        } catch (err) {
            console.error('Update profile error:', err)
            error.value = err.response?.data?.message || 'Failed to update profile'
            throw err
        } finally {
            loading.value = false
        }
    }

    // ------------------------
    // Logout
    // ------------------------
    const logout = async () => {
        loading.value = true
        try {
            await simulateDelay(500)
            user.value = null
            token.value = null
            localStorage.removeItem('user')
            localStorage.removeItem('token')
            return true
        } finally {
            loading.value = false
        }
    }

    // ------------------------
    // Helpers
    // ------------------------
    const isAuthenticated = () => !!user.value && !!token.value

    return {
        user,
        token,
        loading,
        error,
        register,
        login,
        fetchMe,
        updateProfile,
        logout,
        isAuthenticated,
    }
})
