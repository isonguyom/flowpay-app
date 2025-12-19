<script setup>
import { ref, watch } from 'vue'
import BaseInput from '@/components/utilities/BaseInput.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import BaseButton from '@/components/utilities/BaseButton.vue'
import { useAuthStore } from '@/stores/auth'

import { useUtils } from '@/composables/useUtils'

const authStore = useAuthStore()
const { gotoRoute } = useUtils()

let nameTimeout, emailTimeout, passwordTimeout
const loading = ref(false)
const form = ref({
    name: '',
    email: '',
    password: ''
})

const errors = ref({
    name: null,
    email: null,
    password: null
})

const hints = ref({
    name: '',
    email: '',
    password: 'Password must be at least 8 characters'
})

// --- Validation functions ---
const validateName = (value) => {
    if (!value) errors.value.name = 'Name is required'
    else errors.value.name = null
}

const validateEmail = (value) => {
    if (!value) errors.value.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(value)) errors.value.email = 'Email is invalid'
    else errors.value.email = null
}

const validatePassword = (value) => {
    if (!value) errors.value.password = 'Password is required'
    else if (value.length < 8) errors.value.password = 'Password must be at least 8 characters'
    else errors.value.password = null
}

// --- Debounced watchers ---
watch(() => form.value.name, (newVal) => {
    clearTimeout(nameTimeout)
    nameTimeout = setTimeout(() => validateName(newVal), 300)
})

watch(() => form.value.email, (newVal) => {
    clearTimeout(emailTimeout)
    emailTimeout = setTimeout(() => validateEmail(newVal), 300)
})

watch(() => form.value.password, (newVal) => {
    clearTimeout(passwordTimeout)
    passwordTimeout = setTimeout(() => validatePassword(newVal), 300)
})

// --- Register handler ---
const register = async () => {
    validateName(form.value.name)
    validateEmail(form.value.email)
    validatePassword(form.value.password)

    if (errors.value.name || errors.value.email || errors.value.password) return

    loading.value = true
    try {
        const success = await authStore.register(form.value.name, form.value.email, form.value.password)

        if (success) {
            gotoRoute('/dashboard') // Only redirect if registration was successful
        }
    } catch (err) {
        errors.value.email
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <AuthLayout>
        <form @submit.prevent="register" class="space-y-4">

            <BaseInput id="register-name" label="Full Name" type="text" placeholder="John Doe" v-model="form.name"
                :error="errors.name" :hint="hints.name" />

            <BaseInput id="register-email" label="Email address" type="email" placeholder="you@example.com"
                v-model="form.email" :error="errors.email" :hint="hints.email" />

            <BaseInput id="register-password" label="Password" type="password" placeholder="••••••••"
                v-model="form.password" :error="errors.password" :hint="hints.password" />

            <BaseButton fullWidth type="submit" :loading="loading">
                <span>Register</span>
            </BaseButton>

            <p v-if="authStore.error" class="text-sm text-red-600 text-center">
                {{ authStore.error }}
            </p>

        </form>
    </AuthLayout>
</template>
