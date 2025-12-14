<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import BaseButton from '@/components/utilities/BaseButton.vue'
import BaseInput from '@/components/utilities/BaseInput.vue'
import BaseSelect from '@/components/utilities/BaseSelect.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import DarkModeToggle from '@/components/DarkModeToggle.vue'

import { useAuthStore } from '@/stores/auth'
import { useCurrencyStore } from '@/stores/currency'
import { useValidators } from '@/composables/useValidators'

const currencyStore = useCurrencyStore()
const authStore = useAuthStore()
const { validateRequired, validateEmail } = useValidators()

// ------------------------
// State
// ------------------------
const loading = ref(false)
const settings = ref({
    userName: 'John Doe',
    userEmail: 'johndoe@gmail.com',
    defaultCurrency: 'USD',
})

const errors = ref({
    userName: null,
    userEmail: null,
    defaultCurrency: null,
})

const hints = ref({

})

// ------------------------
// Validation
// ------------------------
const validateForm = () => {
    errors.value.userName = validateRequired(settings.value.userName, 'Name is required')
    errors.value.userEmail =
        validateRequired(settings.value.userEmail, 'Email is required') ||
        validateEmail(settings.value.userEmail, 'Invalid email address')
    errors.value.defaultCurrency = validateRequired(settings.value.defaultCurrency, 'Please select a currency')

    return !Object.values(errors.value).some(Boolean)
}

// ------------------------
// Actions
// ------------------------
const saveSettings = async () => {
    if (!validateForm()) return

    loading.value = true
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log('Settings saved:', { ...settings.value })
    loading.value = false
}

const logout = async () => {
    authStore.loading = true
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await authStore.logout()
    authStore.loading = false
}

// ------------------------
// Lifecycle
// ------------------------
onMounted(async () => {
    await currencyStore.fetchCurrencies()
})
</script>

<template>
    <AppLayout>
        <div class="w-full max-w-2xl space-y-8 mx-auto py-6">
            <!-- Header -->
            <PageHeader title="Settings" subtitle="Manage your account preferences" />

            <!-- Account Info Form -->
            <form @submit.prevent="saveSettings" class="space-y-6">
                <BaseInput label="Name" v-model="settings.userName" :error="errors.userName" :hint="hints.userName" />
                <BaseInput label="Email" v-model="settings.userEmail" :error="errors.userEmail"
                    :hint="hints.userEmail" />
                <BaseSelect label="Default Currency" v-model="settings.defaultCurrency"
                    :options="currencyStore.currencyOptions" :error="errors.defaultCurrency"
                    :hint="hints.defaultCurrency" :loading="currencyStore.loading" />

                <BaseButton type="submit" fullWidth :loading="loading">
                    Save Settings
                </BaseButton>
            </form>

            <!-- Appearance Mode -->
            <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Appearance Mode</span>
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
