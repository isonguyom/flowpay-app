<script setup>
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'

import AppLayout from '@/layouts/AppLayout.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/utilities/BaseButton.vue'
import BaseInput from '@/components/utilities/BaseInput.vue'
import BaseSelect from '@/components/utilities/BaseSelect.vue'
import DarkModeToggle from '@/components/DarkModeToggle.vue'

import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { useFxStore } from '@/stores/fx'
import { useValidators } from '@/composables/useValidators'
import { useUtils } from '@/composables/useUtils'

const authStore = useAuthStore()
const userStore = useUserStore()
const fxStore = useFxStore()

const { fxList, loading: fxLoading } = storeToRefs(fxStore)
const { gotoRoute } = useUtils()
const { validateRequired, validateEmail } = useValidators()

// ------------------------
// State
// ------------------------
const loading = ref(false)

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
    () => userStore.profile,
    (profile) => {
        if (!profile) return

        settings.value = {
            userName: profile.name,
            userEmail: profile.email,
            defaultCurrency: profile.defaultCurrency || 'USD',
        }
    },
    { immediate: true }
)

// ------------------------
// Validation
// ------------------------
const validateForm = () => {
    errors.value.userName = validateRequired(settings.value.userName, 'Name is required')

    errors.value.userEmail =
        validateRequired(settings.value.userEmail, 'Email is required') ||
        validateEmail(settings.value.userEmail, 'Invalid email address')

    errors.value.defaultCurrency = validateRequired(
        settings.value.defaultCurrency,
        'Please select a currency'
    )

    return !Object.values(errors.value).some(Boolean)
}

// ------------------------
// Actions
// ------------------------
const saveSettings = async () => {
    if (!validateForm()) return

    loading.value = true
    try {

        await userStore.updateProfile({
            name: settings.value.userName,
            email: settings.value.userEmail,
            defaultCurrency: settings.value.defaultCurrency,
        })

    } catch (err) {
        errors.value.userEmail
    } finally {
        loading.value = false
    }
}

const logout = () => {
    userStore.clearProfile()
    const success = authStore.logout()
    if (success) {
        // Only redirect if login was successful
        gotoRoute('/login')
    }
}

// ------------------------
// Lifecycle
// ------------------------
onMounted(async () => {
    await fxStore.fetchFx()

    if (authStore.isAuthenticated() && !userStore.profile) {
        await userStore.fetchProfile()
    }
})
</script>

<template>
    <AppLayout>
        <div class="w-full max-w-2xl space-y-8 mx-auto py-6">
            <!-- Header -->
            <PageHeader title="Settings" subtitle="Manage your account preferences" />

            <!-- Account Info -->
            <form @submit.prevent="saveSettings" class="space-y-6">
                <BaseInput label="Name" v-model="settings.userName" :error="errors.userName" />

                <BaseInput label="Email" v-model="settings.userEmail" :error="errors.userEmail" />

                <BaseSelect label="Default Currency" v-model="settings.defaultCurrency" :options="fxList"
                    :error="errors.defaultCurrency" :loading="fxLoading" />

                <BaseButton type="submit" fullWidth :loading="loading">
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
                <BaseButton variant="outline" fullWidth @click="logout" :loading="authStore.loading">
                    Logout
                </BaseButton>
            </div>
        </div>
    </AppLayout>
</template>
