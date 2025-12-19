<script setup>
import TransactionCard from '@/components/cards/TransactionCard.vue'

defineProps({
    transactions: {
        type: Array,
        default: () => [],
    },
})
</script>

<template>
    <transition-group name="fade-slide" tag="div" class="w-full overflow-x-auto scrollbar-none
           rounded-xl border border-gray-200 dark:border-gray-800
           bg-white dark:bg-gray-900
           divide-y divide-gray-200 dark:divide-gray-800">
        <TransactionCard v-for="trx in transactions" :key="trx._id" :transaction="trx" />
    </transition-group>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.3s ease;
}

.fade-slide-enter-from {
    opacity: 0;
    transform: translateY(-10px);
}

.fade-slide-enter-to {
    opacity: 1;
    transform: translateY(0);
}
</style>
