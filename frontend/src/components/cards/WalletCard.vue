<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import BaseButton from '@/components/utilities/BaseButton.vue'

import { useFxStore } from '@/stores/fx'
import { useUtils } from '@/composables/useUtils'
import { useFx } from '@/composables/useFx'

// -------------------- Props --------------------
const props = defineProps({
    wallet: {
        type: Object,
        required: true,
    },
})

// -------------------- Emits --------------------
const emit = defineEmits(['fund', 'withdraw'])

// -------------------- Stores & Composables --------------------
const fxStore = useFxStore()
const { fxList, feeRate, loading: fxLoading } = storeToRefs(fxStore)
const { formatCurrencyCompact } = useUtils()
const { convert } = useFx({ feeRate, rates: fxList })

// -------------------- Reactive State --------------------
const isVisible = ref(true)
const toggleVisibility = () => (isVisible.value = !isVisible.value)

// -------------------- Lifecycle --------------------
onMounted(async () => {
    if (!fxList.value.length) {
        await fxStore.fetchFx()
    }
})

// -------------------- Handlers --------------------
const handleFund = () => emit('fund', props.wallet)
const handleWithdraw = () => emit('withdraw', props.wallet)
</script>

<template>
    <div class="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg min-w-xs space-y-5">
        <!-- Header -->
        <div class="flex justify-between items-start">
            <div class="space-y-1">
                <span class="text-sm md:text-base font-semibold text-gray-600 dark:text-gray-400">
                    {{ wallet.currency }} Wallet
                </span>

                <!-- Balance -->
                <div
                    class="mt-1 flex items-center gap-x-2 font-semibold text-lg md:text-xl text-gray-800 dark:text-gray-100 relative w-fit">
                    <span>{{ isVisible ? formatCurrencyCompact(wallet.balance, wallet.currency) : '•••••' }}</span>
                    <button type="button" @click="toggleVisibility" class="absolute inset-y-0 -right-5 flex items-center text-gray-500 dark:text-gray-400 text-sm
                   hover:text-gray-700 dark:hover:text-gray-200
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
                        :aria-label="isVisible ? 'Hide balance' : 'Show balance'" :aria-pressed="isVisible">
                        <i :class="isVisible ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'" aria-hidden="true" />
                    </button>
                </div>

                <!-- Dollar Equivalent -->
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    ≈ $
                    <span>{{ isVisible ? convert(wallet.balance, wallet.currency, 'USD', false).toFixed(2) || '0.00' :
                        '•••••' }}</span>
                </p>
            </div>

            <!-- Currency Badge -->
            <span class="text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                :style="`background-color: ${wallet?.color || '#6B7280'}`">
                {{ wallet.currency }}
            </span>
        </div>

        <!-- Actions -->
        <div class="flex justify-between gap-4">
            <BaseButton variant="solid" class="w-full" @click="handleFund" size="sm">Fund</BaseButton>
            <!-- <BaseButton variant="outline" class="w-full" @click="handleWithdraw" size="sm">Withdraw</BaseButton> -->
        </div>
    </div>
</template>
