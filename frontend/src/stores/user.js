import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

import { useHelpers } from '@/composables/useHelpers'

export const useUserStore = defineStore('user', () => {
    const { simulateDelay } = useHelpers()
    const authStore = useAuthStore()

    // ------------------------
    // State
    // ------------------------
    const profile = ref(authStore.user || null)
    const loading = ref(false)
    const error = ref(null)

    // ------------------------
    // Fetch logged-in user
    // ------------------------
    const fetchProfile = async () => {
        loading.value = true
        error.value = null

        try {
            //Simulate delay
            await simulateDelay(600)

            const res = await api.get('/auth/me')
            profile.value = res.data

            // Sync auth store
            authStore.user = res.data
            localStorage.setItem('user', JSON.stringify(res.data))
        } catch (err) {
            console.error(err)
            error.value =
                err.response?.data?.message || 'Failed to fetch user profile'
        } finally {
            loading.value = false
        }
    }

    // ------------------------
    // Update logged-in user
    // ------------------------
    const updateProfile = async (payload) => {
        loading.value = true
        error.value = null

        try {
            // Simulate delay
            await simulateDelay()

            const res = await api.put('/auth/me', payload)

            profile.value = res.data.user
            authStore.user = res.data.user

            localStorage.setItem('user', JSON.stringify(res.data.user))

            return true
        } catch (err) {
            console.error(err)
            error.value =
                err.response?.data?.message || 'Failed to update profile'
            throw err
        } finally {
            loading.value = false
        }
    }

    // ------------------------
    // Reset on logout
    // ------------------------
    const clearProfile = () => {
        profile.value = null
        error.value = null
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
