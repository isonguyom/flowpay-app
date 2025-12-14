<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import BaseButton from '@/components/utilities/BaseButton.vue'
import BaseInput from '@/components/utilities/BaseInput.vue'
import BaseSelect from '@/components/utilities/BaseSelect.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useCurrencyStore } from '@/stores/currency'

const currencyStore = useCurrencyStore()

// ------------------------
// User Settings State
// ------------------------
const loading = ref(false)
const logoutLoading = ref(false)
const settings = ref({
    userName: 'John Doe',
    userEmail: 'johndoe@gmail.com',
    defaultCurrency: 'USD',
})

// Errors & hints
const errors = ref({
    userName: null,
    userEmail: null,
    defaultCurrency: null,
})

const hints = ref({
    userName: 'Enter your full name',
    userEmail: 'Enter your email address',
    defaultCurrency: 'Select your default currency',
})

// ------------------------
// Validation
// ------------------------
const validate = () => {
    const { userName, userEmail, defaultCurrency } = settings.value

    errors.value.userName = userName.trim() ? null : 'Name is required'
    errors.value.userEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)
        ? null
        : 'Valid email is required'
    errors.value.defaultCurrency = defaultCurrency ? null : 'Please select a currency'

    return !Object.values(errors.value).some(Boolean)
}

// ------------------------
// Actions
// ------------------------
// ------------------------
// Save Settings
// ------------------------
const saveSettings = () => {
    if (!validate()) return

    loading.value = true

    // Simulate API call
    setTimeout(() => {
        console.log('Settings saved:', { ...settings.value })
        loading.value = false
    }, 1500)
}

// ------------------------
// Logout
// ------------------------
const logout = () => {
    logoutLoading.value = true

    // Simulate logout API call
    setTimeout(() => {
        console.log('Logout triggered')
        logoutLoading.value = false
        // Implement real logout logic here
    }, 1000)
}

// Fetch currencies on mount
onMounted(async () => {
    await currencyStore.fetchCurrencies()
})
</script>

<template>
    <AppLayout>
        <div class="w-full max-w-xl space-y-8 mx-auto py-6">
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

            <!-- Logout -->
            <div class="pt-4 border-t border-gray-200 dark:border-gray-800">
                <BaseButton variant="outline" fullWidth @click="logout" :loading="logoutLoading">
                    Logout
                </BaseButton>
            </div>
        </div>
    </AppLayout>
</template>
