<script setup>
import WalletCard from '@/components/cards/WalletCard.vue';

defineProps({
    wallets: {
        type: Array,
        default: () => [],
    },
})

const onFund = (wallet) => {
    console.log('Deposit clicked for', wallet.currency)
    // Open deposit modal or navigate to deposit page
}

const onWithdraw = (wallet) => {
    console.log('Withdraw clicked for', wallet.currency)
    // Open withdraw modal or navigate to withdraw page
}
</script>

<template>
    <div class="flex gap-4 overflow-x-auto scrollbar-none pb-2">
        <WalletCard v-for="wallet in wallets" :key="wallet.id" :wallet="wallet" @fund="onFund" @withdraw="onWithdraw" />
    </div>

</template>