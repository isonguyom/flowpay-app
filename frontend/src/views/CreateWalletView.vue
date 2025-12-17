<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import AppLayout from '@/layouts/AppLayout.vue'
import BaseInput from '@/components/utilities/BaseInput.vue'
import BaseButton from '@/components/utilities/BaseButton.vue'
import BaseSelect from '@/components/utilities/BaseSelect.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ConfirmModal from '@/components/utilities/ConfirmModal.vue'
import BaseToast from '@/components/utilities/BaseToast.vue'

import { useCurrencyStore } from '@/stores/currency'
import { useWalletStore } from '@/stores/wallets'

// ------------------------
// Stores
// ------------------------
const walletStore = useWalletStore()
const currencyStore = useCurrencyStore()

const { loading: walletLoading, error: walletError } = storeToRefs(walletStore)
const { currencyOptions, loading: currencyLoading } = storeToRefs(currencyStore)

// ------------------------
// Form State
// ------------------------
const loading = ref(false)
const showConfirmModal = ref(false)
const toastRef = ref(null)

const wallet = ref({
    currency: '',
    initialAmount: 0, // always 0
})

const touched = ref({
    currency: false,
})

const errors = ref({
    currency: null,
})

// ------------------------
// Validation
// ------------------------
const validate = () => {
    errors.value.currency =
        touched.value.currency && !wallet.value.currency
            ? 'Select a currency'
            : null
}

// ------------------------
// Form Validity
// ------------------------
const isFormValid = computed(() => wallet.value.currency)

// ------------------------
// Submit Handlers
// ------------------------
const confirmCreateWallet = () => {
    touched.value.currency = true
    validate()

    if (!isFormValid.value) {
        toastRef.value.addToast('Please select a currency', 'error')
        return
    }

    showConfirmModal.value = true
}

const createWallet = async () => {
    showConfirmModal.value = false
    loading.value = true

    try {
        await walletStore.createWallet({
            currency: wallet.value.currency,
            amount: 0, // always 0
        })

        toastRef.value.addToast(
            `Wallet for ${wallet.value.currency} created successfully!`,
            'success'
        )

        // Reset form
        wallet.value.currency = currencyOptions[0]?.value || ''
        touched.value.currency = false
    } catch (err) {
        toastRef.value.addToast(walletStore.error || 'Failed to create wallet', 'error')
    } finally {
        loading.value = false
    }
}

// ------------------------
// Lifecycle
// ------------------------
onMounted(async () => {
    await currencyStore.fetchCurrencies()
    wallet.value.currency = currencyOptions[0]?.value || ''
})
</script>

<template>
    <AppLayout>
        <div class="w-full max-w-2xl mx-auto py-6 space-y-8">
            <PageHeader title="Create Wallet" subtitle="Add a new currency wallet to your account" />

            <form @submit.prevent="confirmCreateWallet" class="space-y-6">
                <BaseSelect label="Currency" v-model="wallet.currency" :options="currencyOptions"
                    :loading="currencyLoading" :error="errors.currency" @change="touched.currency = true" />

                <BaseInput label="Initial Amount" type="number" placeholder="0.00" v-model="wallet.initialAmount"
                    :readonly="true" :error="null" :disabled="true" />

                <BaseButton type="submit" fullWidth :disabled="!isFormValid || loading" :loading="loading">
                    Create Wallet
                </BaseButton>
            </form>

            <!-- Confirmation Modal -->
            <ConfirmModal :show="showConfirmModal" title="Confirm Wallet Creation" :loading="loading"
                @close="showConfirmModal = false" @confirm="createWallet">
                <p>
                    You are about to create a wallet with
                    <strong>{{ wallet.currency }}</strong> currency
                    and an initial balance of
                    <strong>0</strong>.
                </p>
            </ConfirmModal>

            <!-- Toast -->
            <BaseToast ref="toastRef" />
        </div>
    </AppLayout>
</template>
