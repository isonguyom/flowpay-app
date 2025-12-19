<script setup>
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'

import AppLayout from '@/layouts/AppLayout.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/utilities/BaseButton.vue'
import BaseInput from '@/components/utilities/BaseInput.vue'
import BaseSelect from '@/components/utilities/BaseSelect.vue'
import BaseToast from '@/components/utilities/BaseToast.vue'
import DarkModeToggle from '@/components/DarkModeToggle.vue'

import { useAuthStore } from '@/stores/auth'
import { useFxStore } from '@/stores/fx'
import { useValidators } from '@/composables/useValidators'
import { useUtils } from '@/composables/useUtils'

// ------------------------
// Stores & utils
// ------------------------
const authStore = useAuthStore()
const fxStore = useFxStore()

const { fxList, loading: fxLoading } = storeToRefs(fxStore)
const { gotoRoute } = useUtils()
const { validateRequired, validateEmail } = useValidators()

// ------------------------
// UI
// ------------------------
const toastRef = ref(null)

// ------------------------
// Form State
// ------------------------
const settings = ref({
    userName: '',
    userEmail: '',
    defaultCurrency: 'USD',
})

const errors = ref({
    userName: null,
    userEmail: null,
    defaultCurrency: null,
})

// ------------------------
// Sync store → form
// ------------------------
watch(
    () => authStore.user,
    (user) => {
        if (!user) return

        settings.value = {
            userName: user.name || '',
            userEmail: user.email || '',
            defaultCurrency: user.defaultCurrency || 'USD',
        }
    },
    { immediate: true }
)

// ------------------------
// Validation
// ------------------------
const validateForm = () => {
    errors.value.userName =
        validateRequired(settings.value.userName, 'Name is required')

    errors.value.userEmail =
        validateRequired(settings.value.userEmail, 'Email is required') ||
        validateEmail(settings.value.userEmail, 'Invalid email address')

    errors.value.defaultCurrency =
        validateRequired(settings.value.defaultCurrency, 'Please select a currency')

    return !Object.values(errors.value).some(Boolean)
}

// ------------------------
// Actions
// ------------------------
const saveSettings = async () => {
    if (!validateForm()) {
        toastRef.value?.addToast('Please fix the form errors', 'error')
        return
    }

    try {
        await authStore.updateProfile({
            name: settings.value.userName,
            email: settings.value.userEmail,
            defaultCurrency: settings.value.defaultCurrency,
        })

        toastRef.value?.addToast(
            'Settings updated successfully',
            'success'
        )
    } catch (err) {
        toastRef.value?.addToast(
            err?.response?.data?.message || 'Failed to update settings',
            'error'
        )
    }
}

const logout = async () => {
    try {
        // Ensure stores fully reset first
        // authStore.clearProfile()
        await authStore.logout()

        // Redirect only AFTER logout is complete
        gotoRoute('/login')
    } catch {
        toastRef.value?.addToast('Logout failed', 'error')
    }
}

// ------------------------
// Lifecycle
// ------------------------
onMounted(async () => {
    try {
        await fxStore.fetchFx()

        if (authStore.isAuthenticated() && !authStore.user) {
            await authStore.fetchMe()
        }
    } catch {
        toastRef.value?.addToast('Failed to load settings', 'error')
    }
})
</script>

<template>
    <AppLayout>
        <div class="w-full max-w-2xl mx-auto py-6 space-y-8">
            <!-- Header -->
            <PageHeader title="Settings" subtitle="Manage your account preferences" />

            <!-- Account Settings -->
            <form @submit.prevent="saveSettings" class="space-y-6">
                <BaseInput label="Name" v-model="settings.userName" :error="errors.userName" />

                <BaseInput label="Email" v-model="settings.userEmail" :error="errors.userEmail" />

                <BaseSelect label="Default Currency" v-model="settings.defaultCurrency" :options="fxList"
                    :loading="fxLoading" :error="errors.defaultCurrency" />

                <BaseButton type="submit" fullWidth :loading="authStore.loading">
                    Save Settings
                </BaseButton>
            </form>

            <!-- Appearance -->
            <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Appearance Mode
                </span>
                <DarkModeToggle />
            </div>

            <!-- Logout -->
            <div class="pt-4 border-t border-gray-200 dark:border-gray-800">
                <BaseButton variant="outline" fullWidth :loading="authStore.loading" @click="logout">
                    Logout
                </BaseButton>
            </div>

            <!-- Toast -->
            <BaseToast ref="toastRef" />
        </div>
    </AppLayout>
</template>
