<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import BaseButton from '@/components/utilities/BaseButton.vue'

import { useFxStore } from '@/stores/fx'
import { useUtils } from '@/composables/useUtils'
import { useFx } from '@/composables/useFx'

// Props
const props = defineProps({
    wallet: {
        type: Object,
        required: true,
    },
})

// Emits
const emit = defineEmits(['fund', 'withdraw'])

// Stores
const fxStore = useFxStore()
const { fxList, feeRate, loading: fxLoading } = storeToRefs(fxStore)

// Composables
const { formatCurrencyCompact } = useUtils()

const { convert } = useFx({
    feeRate,
    rates: fxList,
})

// Visibility toggle
const isVisible = ref(true)
const toggleVisibility = () => {
    isVisible.value = !isVisible.value
}

onMounted(async () => {
    await fxStore.fetchFx()
})

// Handlers
const handleFund = () => emit('fund', props.wallet)
const handleWithdraw = () => emit('withdraw', props.wallet)
</script>

<template>
    <div class="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg min-w-xs space-y-5">
        <!-- Wallet Header -->
        <div class="flex justify-between items-start">

            <div class="space-y-1">
                <span class="text-sm md:text-base font-semibold text-gray-600 dark:text-gray-400 flex-1">
                    {{ wallet.currency }} Wallet
                </span>
                <div
                    class=" mt-2 flex items-center gap-x-2 font-semibold text-lg md:text-xl text-gray-800 dark:text-gray-100 relative w-fit">
                    <span v-if="isVisible">{{ formatCurrencyCompact(wallet.balance, wallet.currency) }}</span>
                    <span v-else>•••••</span>

                    <button type="button" @click="toggleVisibility" class="absolute inset-y-0 -right-5 flex items-center text-gray-500 dark:text-gray-400 text-sm
                           hover:text-gray-700 dark:hover:text-gray-200
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
                        :aria-label="isVisible ? 'Hide balance' : 'Show balance'" :aria-pressed="isVisible">
                        <i :class="isVisible ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'" aria-hidden="true" />
                    </button>
                </div>

                <p class="text-sm text-gray-500 dark:text-gray-400">
                    ≈ $<span v-if="isVisible">{{ convert(wallet.balance, wallet.currency, 'USD', false).toFixed(2) ||
                        '0.00' }}</span>
                    <span v-else>•••••</span>
                </p>
            </div>

            <!-- Currency Badge -->
            <span class="text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                :style="`background-color: ${wallet?.color || '#6B7280'}`">
                {{ wallet.currency }}
            </span>
        </div>

        <!-- Wallet Balance & Dollar Equivalent -->


        <!-- Deposit & Withdraw -->
        <div class="flex justify-between gap-4">
            <BaseButton variant="solid" class="w-full" @click="handleFund" size="sm">Fund</BaseButton>
            <!-- <BaseButton variant="outline" class="w-full" @click="handleWithdraw" size="sm">Withdraw</BaseButton> -->
        </div>
    </div>
</template>
