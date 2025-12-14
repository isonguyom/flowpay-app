<script setup>
import WalletCard from '@/components/cards/WalletCard.vue';

defineProps({
    wallets: {
        type: Array,
        default: () => [],
    },
})

const onDeposit = (wallet) => {
    console.log('Deposit clicked for', wallet.currency)
    // Open deposit modal or navigate to deposit page
}

const onWithdraw = (wallet) => {
    console.log('Withdraw clicked for', wallet.currency)
    // Open withdraw modal or navigate to withdraw page
}
</script>

<template>
    <div class="flex justify-around gap-4 overflow-x-auto scrollbar-none">
        <WalletCard v-for="wallet in wallets" :key="wallet.id" :wallet="wallet" @deposit="onDeposit"
            @withdraw="onWithdraw" />
    </div>

</template>