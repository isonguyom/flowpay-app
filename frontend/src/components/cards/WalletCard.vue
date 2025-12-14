<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import BaseButton from '@/components/utilities/BaseButton.vue'

import { useFxStore } from '@/stores/fx'
import { useUtils } from '@/composables/useUtils'
import { useHelpers } from '@/composables/useHelpers'
import { useFx } from '@/composables/useFx'

// Props
const props = defineProps({
    wallet: {
        type: Object,
        required: true,
    },
})

// Emits
const emit = defineEmits(['deposit', 'withdraw'])

// Stores
const fxStore = useFxStore()
const { fxRates, feeRate, loading: fxLoading } = storeToRefs(fxStore)

// Composables
const { formatCurrencyCompact } = useUtils()
const { getCurrencyColor } = useHelpers()
const { convert } = useFx({
    feeRate: feeRate.value,
    initialRates: fxRates.value,
})

// Visibility toggle
const isVisible = ref(true)
const toggleVisibility = () => {
    isVisible.value = !isVisible.value
}

onMounted(async () => {
    await fxStore.fetchRates()
})

// Handlers
const handleDeposit = () => emit('deposit', props.wallet)
const handleWithdraw = () => emit('withdraw', props.wallet)
</script>

<template>
    <div class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-lg min-w-sm space-y-3">
        <!-- Wallet Header -->
        <div class="flex justify-between items-center">
            <span class="text-lg font-semibold text-gray-700 dark:text-gray-300 flex-1">
                {{ wallet.currency }} Wallet
            </span>

            <!-- Currency Badge -->
            <span class="text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                :class="getCurrencyColor(wallet.currency)">
                {{ wallet.currency }}
            </span>
        </div>

        <!-- Wallet Amount & Dollar Equivalent -->
        <div class="space-y-1">
            <div
                class="flex items-center gap-x-2 font-semibold text-xl text-gray-800 dark:text-gray-100 relative w-fit">
                <span v-if="isVisible">{{ formatCurrencyCompact(wallet.amount, wallet.currency) }}</span>
                <span v-else>•••••</span>

                <button type="button" @click="toggleVisibility" class="absolute inset-y-0 -right-5 flex items-center text-gray-500 dark:text-gray-400 text-sm
                           hover:text-gray-700 dark:hover:text-gray-200
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
                    :aria-label="isVisible ? 'Hide amount' : 'Show amount'" :aria-pressed="isVisible">
                    <i :class="isVisible ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'" aria-hidden="true" />
                </button>
            </div>

            <p class="text-sm text-gray-500 dark:text-gray-400">
                ≈ $<span v-if="isVisible">{{ convert(wallet.amount, wallet.currency, 'USD', false) || 0 }}</span>
                <span v-else>•••••</span>
            </p>
        </div>

        <!-- Deposit & Withdraw -->
        <div class="flex justify-between gap-4">
            <BaseButton variant="solid" class="w-full" @click="handleDeposit">Deposit</BaseButton>
            <BaseButton variant="outline" class="w-full" @click="handleWithdraw">Withdraw</BaseButton>
        </div>
    </div>
</template>
