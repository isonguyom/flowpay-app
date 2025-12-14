// src/stores/auth.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useHelpers } from '@/composables/useHelpers'

export const useAuthStore = defineStore('auth', () => {

    const { simulateDelay } = useHelpers()
    // ------------------------
    // State
    // ------------------------
    const user = ref(null)
    const token = ref(null)
    const loading = ref(false)
    const error = ref(null)

    // ------------------------
    // Actions
    // ------------------------

    // Simulated login
    const login = async (email, password) => {
        loading.value = true
        error.value = null

        try {
            // Simulate network/API call
            await simulateDelay(1500)

            // Example response
            user.value = { id: 1, name: 'John Doe', email }
            token.value = 'fake-jwt-token'

            console.log('User logged in:', user.value)
        } catch (err) {
            error.value = 'Login failed'
        } finally {
            loading.value = false
        }
    }

    // Logout
    const logout = async () => {
        loading.value = true
        await simulateDelay(1000)


        user.value = null
        token.value = null
        loading.value = false

        console.log('User logged out')
    }

    // Check if user is authenticated
    const isAuthenticated = () => !!user.value && !!token.value

    return { user, token, loading, error, login, logout, isAuthenticated }
})
