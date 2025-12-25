<script setup>
import { computed, onMounted } from 'vue'
import { useWalletStore } from '@/stores/wallets'
import { useWalletSocket } from '@/composables/useWalletSocket'
import { MAX_DISPLAY_WALLET } from '@/constants/walletConstants'

import ApiSkeleton from '@/components/ui/ApiSkeleton.vue'
import WalletCard from '@/components/cards/WalletCard.vue'

// -------------------- Props --------------------
const props = defineProps({
    showSkeleton: { type: Boolean, default: true },
    maxItems: { type: Number, default: MAX_DISPLAY_WALLET },
})

// -------------------- Emits --------------------
const emit = defineEmits(['fund', 'withdraw'])

// -------------------- Store --------------------
const walletStore = useWalletStore()

// -------------------- Socket handlers --------------------
const handleWalletCreated = (wallet) => wallet?._id && walletStore.addWallet(wallet)
const handleWalletUpdated = (wallet) => wallet?._id && walletStore.updateWallet(wallet)

// -------------------- Socket composable --------------------
useWalletSocket({
    onCreated: handleWalletCreated,
    onUpdated: handleWalletUpdated,
})

// -------------------- Computed --------------------
const displayedWallets = computed(() =>
    props.maxItems ? walletStore.wallets.slice(0, props.maxItems) : walletStore.wallets
)

const totalBalance = computed(() =>
    walletStore.wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0)
)

// -------------------- Lifecycle --------------------
onMounted(async () => {
    if (!walletStore.wallets.length) await walletStore.fetchWallets()
})

// -------------------- Handlers --------------------
const handleFund = (wallet) => emit('fund', wallet)
const handleWithdraw = (wallet) => emit('withdraw', wallet)

// -------------------- Expose --------------------
defineExpose({
    wallets: computed(() => walletStore.wallets),
    totalBalance,
    loading: computed(() => walletStore.loading),
    error: computed(() => walletStore.error),
})
</script>

<template>
    <ApiSkeleton :loading="walletStore.loading" :error="walletStore.error" :items="displayedWallets">
        <template #default="{ items }">
            <div class="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                <WalletCard v-for="wallet in items" :key="wallet._id" :wallet="wallet" class="snap-start"
                    @fund="handleFund" @withdraw="handleWithdraw" />
            </div>
        </template>
    </ApiSkeleton>
</template>
