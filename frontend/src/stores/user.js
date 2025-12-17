import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

export const useUserStore = defineStore('user', () => {
    const authStore = useAuthStore()

    // ------------------------
    // State
    // ------------------------
    const profile = ref(authStore.user || null)
    const loading = ref(false)
    const error = ref(null)

    // ------------------------
    // Actions
    // ------------------------

    // Fetch logged-in user
    const fetchProfile = async () => {
        loading.value = true
        error.value = null

        try {
            const res = await api.get('/auth/me')
            profile.value = res.data

            // sync auth store
            authStore.user = res.data
            localStorage.setItem('user', JSON.stringify(res.data))
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch user'
        } finally {
            loading.value = false
        }
    }

    // Update logged-in user
    const updateProfile = async (payload) => {
        try {
            console.log('Payload:', payload)
            const res = await api.put('/auth/me', payload)

            authStore.user = res.data.user
            localStorage.setItem('user', JSON.stringify(res.data.user))

            return true
        } catch (err) {
            throw err
        }
    }

    // Reset on logout
    const clearProfile = () => {
        profile.value = null
    }

    return {
        profile,
        loading,
        error,
        fetchProfile,
        updateProfile,
        clearProfile,
    }
})
