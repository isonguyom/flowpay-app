<script setup>
import { ref, watch } from 'vue'

import BaseInput from '@/components/utilities/BaseInput.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import BaseButton from '@/components/utilities/BaseButton.vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

let emailTimeout
let passwordTimeout

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

/* -------------------------
   Validation
-------------------------- */
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

/* -------------------------
   Debounced watchers
-------------------------- */
watch(
    () => form.value.email,
    (newVal) => {
        clearTimeout(emailTimeout)
        emailTimeout = setTimeout(() => validateEmail(newVal), 300)
    }
)

watch(
    () => form.value.password,
    (newVal) => {
        clearTimeout(passwordTimeout)
        passwordTimeout = setTimeout(() => validatePassword(newVal), 300)
    }
)


// --- Login handler ---
const login = async () => {
    validateEmail(form.value.email)
    validatePassword(form.value.password)

    if (errors.value.email || errors.value.password) return

    loading.value = true

    try {
        const success = await authStore.login(form.value.email, form.value.password)

        if (success) {
            // Only redirect if login was successful
            router.push('/dashboard')
        }
    } catch (err) {
        errors.value.email = err
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <AuthLayout>
        <form @submit.prevent="login" class="space-y-4">

            <BaseInput id="signin-email" label="Email address" type="email" placeholder="you@example.com"
                v-model="form.email" :error="errors.email" :hint="hints.email" />

            <BaseInput id="signin-password" label="Password" type="password" placeholder="••••••••"
                v-model="form.password" :error="errors.password" :hint="hints.password" />

            <BaseButton fullWidth type="submit" :loading="loading || authStore.loading">
                <span>Sign in</span>
            </BaseButton>

            <p v-if="authStore.error" class="text-sm text-red-600 text-center">
                {{ authStore.error }}
            </p>

        </form>
    </AuthLayout>
</template>
