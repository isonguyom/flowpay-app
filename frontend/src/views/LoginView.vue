<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'

import BaseInput from '@/components/utilities/BaseInput.vue'
import BaseButton from '@/components/utilities/BaseButton.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

import { useAuthStore } from '@/stores/auth'
import { useUtils } from '@/composables/useUtils'

const authStore = useAuthStore()
const { gotoRoute } = useUtils()

/* --------------------
   State
-------------------- */
const loading = ref(false)

const form = ref({
    email: '',
    password: ''
})

const errors = ref({
    email: null,
    password: null
})

const hints = ref({
    email: '',
    password: 'Password must be at least 8 characters'
})

/* --------------------
   Debounce timers
-------------------- */
let emailTimeout, passwordTimeout

/* --------------------
   Validation functions
-------------------- */
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

/* --------------------
   Debounced watchers
-------------------- */
watch(() => form.value.email, (val) => {
    clearTimeout(emailTimeout)
    emailTimeout = setTimeout(() => validateEmail(val), 300)
})

watch(() => form.value.password, (val) => {
    clearTimeout(passwordTimeout)
    passwordTimeout = setTimeout(() => validatePassword(val), 300)
})

/* --------------------
   Cleanup timers on unmount
-------------------- */
onBeforeUnmount(() => {
    clearTimeout(emailTimeout)
    clearTimeout(passwordTimeout)
})

/* --------------------
   Form validation
-------------------- */
const isFormValid = () => {
    validateEmail(form.value.email)
    validatePassword(form.value.password)
    return !errors.value.email && !errors.value.password
}

/* --------------------
   Login handler
-------------------- */
const login = async () => {
    if (!isFormValid()) return
    if (loading.value || authStore.loading) return

    loading.value = true
    try {
        const success = await authStore.login(form.value.email, form.value.password)
        if (success) gotoRoute('/dashboard')
    } catch (err) {
        errors.value.email = err?.message || 'Login failed'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <AuthLayout>
        <form @submit.prevent="login" class="space-y-4" novalidate aria-live="polite">
            <BaseInput id="signin-email" label="Email address" type="email" placeholder="you@example.com"
                v-model="form.email" :error="errors.email" :hint="hints.email" :aria-invalid="!!errors.email" />

            <BaseInput id="signin-password" label="Password" type="password" placeholder="••••••••"
                v-model="form.password" :error="errors.password" :hint="hints.password"
                :aria-invalid="!!errors.password" />

            <div>
                <BaseButton type="submit" fullWidth :loading="loading || authStore.loading">
                    Sign in
                </BaseButton>

                <p v-if="authStore.error" class="text-xs sm:text-sm text-red-600 text-center mt-2" role="alert">
                    {{ authStore.error }}
                </p>
            </div>
        </form>
    </AuthLayout>
</template>
