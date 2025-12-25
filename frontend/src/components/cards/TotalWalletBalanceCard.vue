<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import BaseButton from '@/components/utilities/BaseButton.vue'

import { useFxStore } from '@/stores/fx'
import { useUtils } from '@/composables/useUtils'
import { useFx } from '@/composables/useFx'

// Props
const props = defineProps({
    totalBalance: {
        type: Number,
        required: true,
    },
    defaultCurrency: {
        type: String,
        default: 'USD'
    }
})


// Stores
const fxStore = useFxStore()
const { fxList, feeRate, loading: fxLoading } = storeToRefs(fxStore)

// Composables
const { formatCurrencyCompact, gotoRoute } = useUtils()

const { convert } = useFx({
    feeRate,
    rates: fxList,
})

// Visibility toggle
const isVisible = ref(true)
const toggleVisibility = () => (isVisible.value = !isVisible.value)

// Computed
const convertedUSD = computed(() => convert(props.totalBalance, props.defaultCurrency, 'USD', false).toFixed(2) || '0.00')

onMounted(async () => {
    await fxStore.fetchFx()
})
</script>

<template>
    <section class="mb-6">
        <div
            class="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md flex flex-wrap items-start justify-between gap-y-2 gap-x-8">

            <div class="space-y-1">
                <!-- Balance Display -->
                <div class="space-y-1">
                    <h3 class="text-sm sm:text-base lg:text-lg font-medium text-gray-500 dark:text-gray-400">Total
                        Wallet Balance</h3>
                    <div
                        class="text-xl sm:text-2xl md:text-4xl not-[]:flex items-center gap-x-2 font-semibold text-gray-800 dark:text-gray-100 relative w-fit">
                        <span v-if="isVisible">{{ formatCurrencyCompact(totalBalance, defaultCurrency) || '0.00'
                            }}</span>
                        <span v-else>•••••</span>

                        <button type="button" @click="toggleVisibility" class="absolute inset-y-0 -right-5 flex items-center text-gray-500 dark:text-gray-400 text-sm
            hover:text-gray-700 dark:hover:text-gray-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
                            :aria-label="isVisible ? 'Hide amount' : 'Show amount'" :aria-pressed="isVisible">
                            <i :class="isVisible ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'" aria-hidden="true" />
                        </button>
                    </div>

                    <p class="text-xs md:text-sm lg:text-base text-gray-500 dark:text-gray-400">
                        ≈ $<span v-if="isVisible">{{ convertedUSD }}</span>
                        <span v-else>•••••</span>
                    </p>
                </div>
                <!-- Create wallet Action -->
                <BaseButton @click="gotoRoute('/wallets/create')" size="sm" variant="ghost">
                    <span class="text-xs md:text-sm">Create Wallet</span>
                </BaseButton>
            </div>

            <!-- Make Payment Action -->
            <div class="flex gap-3 flex-wrap">
                <BaseButton @click="gotoRoute('/payment')" size="sm" variant="solid">
                    <span class="text-xs md:text-sm">Make Payment</span>
                </BaseButton>
            </div>
        </div>
    </section>
</template>
