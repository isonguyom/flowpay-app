import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api' // Axios instance

export const useAuthStore = defineStore('auth', () => {
    // ------------------------
    // State
    // ------------------------
    const user = ref(JSON.parse(localStorage.getItem('user')) || null)
    const token = ref(localStorage.getItem('token') || null)
    const loading = ref(false)
    const error = ref(null)

    // ------------------------
    // Actions
    // ------------------------

    // Register new user
    const register = async (name, email, password) => {
        loading.value = true
        error.value = null
        try {
            const res = await api.post('/auth/register', { name, email, password })

            user.value = res.data.user
            token.value = res.data.token

            localStorage.setItem('user', JSON.stringify(user.value))
            localStorage.setItem('token', token.value)

            console.log('User registered:', user.value)
            return true // ✅ indicates success
        } catch (err) {
            console.error(err)
            error.value = err.response?.data?.message || 'Registration failed'
            return false // ❌ indicates failure
        } finally {
            loading.value = false
        }
    }

    // Login existing user
    const login = async (email, password) => {
        loading.value = true
        error.value = null
        try {
            const res = await api.post('/auth/login', { email, password })

            user.value = res.data.user
            token.value = res.data.token

            localStorage.setItem('user', JSON.stringify(user.value))
            localStorage.setItem('token', token.value)

            console.log('User logged in:', user.value)
            return true // ✅ indicates success
        } catch (err) {
            console.error(err)
            error.value = err.response?.data?.message || 'Login failed'
            return false // ❌ indicates failure
        } finally {
            loading.value = false
        }
    }

    const fetchMe = async () => {
        if (!token.value) return

        try {
            const res = await api.get('/auth/me', {
                headers: {
                    Authorization: `Bearer ${token.value}`,
                },
            })

            user.value = res.data
            localStorage.setItem('user', JSON.stringify(res.data))
        } catch {
            logout()
        }
    }


    // Logout
    const logout = () => {
        user.value = null
        token.value = null
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        console.log('User logged out')
        return true
    }

    // Check if authenticated
    const isAuthenticated = () => !!user.value && !!token.value

    return {
        user,
        token,
        loading,
        error,
        register,
        login,
        logout,
        isAuthenticated,
        fetchMe
    }
})
