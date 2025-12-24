<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import AppLayout from '@/layouts/AppLayout.vue'
import BaseInput from '@/components/utilities/BaseInput.vue'
import BaseSelect from '@/components/utilities/BaseSelect.vue'
import BaseButton from '@/components/utilities/BaseButton.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ConfirmModal from '@/components/utilities/ConfirmModal.vue'
import BaseToast from '@/components/utilities/BaseToast.vue'

import { useWalletStore } from '@/stores/wallets'
import { useFxStore } from '@/stores/fx'
import { useUtils } from '@/composables/useUtils'

// ------------------------
// Stores & utils
// ------------------------
const walletStore = useWalletStore()
const fxStore = useFxStore()
const { gotoRoute } = useUtils()

const { fxList, loading: fxLoading } = storeToRefs(fxStore)

// ------------------------
// State
// ------------------------
const currency = ref('')
const loading = ref(false)
const showConfirmModal = ref(false)
const toastRef = ref(null)
const touched = ref(false)

// ------------------------
// Validation
// ------------------------
const error = computed(() =>
    touched.value && !currency.value ? 'Select a currency' : null
)

const isFormValid = computed(() => !!currency.value)

// ------------------------
// Handlers
// ------------------------
const confirmCreateWallet = () => {
    touched.value = true

    if (!isFormValid.value) {
        toastRef.value?.addToast('Please select a currency', 'error')
        return
    }

    showConfirmModal.value = true
}

const createWallet = async () => {
    showConfirmModal.value = false
    loading.value = true

    try {
        await walletStore.createWallet(currency.value)

        toastRef.value?.addToast(
            `Wallet for ${currency.value} created successfully`,
            'success'
        )

        setTimeout(() => gotoRoute('/dashboard'), 1200)
    } catch {
        toastRef.value?.addToast(
            walletStore.error || 'Failed to create wallet',
            'error'
        )
    } finally {
        loading.value = false
    }
}

// ------------------------
// Lifecycle
// ------------------------
onMounted(async () => {
    await fxStore.fetchFx()
    currency.value = fxList.value?.[0]?.value || ''
})
</script>


<template>
    <AppLayout>
        <div class="w-full max-w-2xl mx-auto py-6 space-y-8">
            <PageHeader title="Create Wallet" subtitle="Add a new currency wallet to your account" />

            <form @submit.prevent="confirmCreateWallet" class="space-y-6">
                <BaseSelect label="Currency" v-model="currency" :options="fxList" :loading="fxLoading" :error="error"
                    @change="touched = true" />

                <!-- Display-only -->
                <BaseInput label="Initial Balance" type="number" value="0.00" placeholder="0.00" readonly disabled />

                <BaseButton type="submit" fullWidth :disabled="!isFormValid || loading" :loading="loading">
                    Create Wallet
                </BaseButton>
            </form>

            <ConfirmModal :show="showConfirmModal" title="Confirm Wallet Creation" :loading="loading"
                @close="showConfirmModal = false" @confirm="createWallet">
                <p>
                    You are about to create a
                    <strong>{{ currency }}</strong> wallet with an initial balance of
                    <strong>0</strong>.
                </p>
            </ConfirmModal>

            <BaseToast ref="toastRef" />
        </div>
    </AppLayout>
</template>
