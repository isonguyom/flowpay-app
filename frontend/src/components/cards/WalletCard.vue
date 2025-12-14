<script setup>
import BaseButton from '@/components/utilities/BaseButton.vue'

const props = defineProps({
    wallet: { type: Object, required: true },
    loading: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['deposit', 'withdraw'])

const statusColor = {
    Active: 'text-green-600',
    Frozen: 'text-red-600',
    Pending: 'text-yellow-600',
}
</script>

<template>
    <div class="rounded-xl border border-gray-200 dark:border-gray-800
           bg-white dark:bg-gray-900 p-5 space-y-4 w-full min-w-xs">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ wallet.currency }} Wallet
            </p>

            <span class="text-xs font-medium" :class="statusColor[wallet.status] || 'text-gray-500'">
                {{ wallet.status }}
            </span>
        </div>

        <!-- Balance -->
        <div>
            <p v-if="loading" class="h-7 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />

            <p v-else class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {{ Number(wallet.balance).toLocaleString() }}
                <span class="text-base font-medium text-gray-500">
                    {{ wallet.currency }}
                </span>
            </p>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
            <BaseButton size="sm" fullWidth @click="emit('deposit')" :disabled="loading">
                Deposit
            </BaseButton>

            <BaseButton size="sm" variant="outline" fullWidth @click="emit('withdraw')" :disabled="loading">
                Withdraw
            </BaseButton>
        </div>
    </div>
</template>
