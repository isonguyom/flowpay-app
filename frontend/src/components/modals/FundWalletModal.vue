<script setup>
import { ref, onMounted, watch } from 'vue'
import { useFundingAccountsStore } from '@/stores/fundingAccounts'

import ConfirmModal from '@/components/utilities/ConfirmModal.vue'
import BaseSelect from '@/components/utilities/BaseSelect.vue'
import BaseInput from '@/components/utilities/BaseInput.vue'

import { MIN_FUND_AMOUNT } from '@/constants/walletConstants'

// -------------------- Props --------------------
const props = defineProps({
    show: Boolean,
    selectedWallet: {
        type: Object,
        default: () => ({})
    }
})

// -------------------- Emits --------------------
const emit = defineEmits(['close', 'confirm'])

// -------------------- Store --------------------
const fundingAccountsStore = useFundingAccountsStore()

// -------------------- State --------------------
const fundForm = ref({
    fundingAccount: '',
    amount: MIN_FUND_AMOUNT,
})

const fundErrors = ref({})
const fundHints = ref({
    amount: `Minimum amount is ${MIN_FUND_AMOUNT}`,
})

const submitting = ref(false)

// -------------------- Validation --------------------
const validateFundForm = () => {
    fundErrors.value = {}

    if (!fundForm.value.fundingAccount) {
        fundErrors.value.fundingAccount = 'Funding account is required.'
    }

    if (fundForm.value.amount < MIN_FUND_AMOUNT) {
        fundErrors.value.amount = `Minimum amount is ${MIN_FUND_AMOUNT}.`
    }

    return Object.keys(fundErrors.value).length === 0
}

// -------------------- Actions --------------------
const resetForm = () => {
    fundForm.value = {
        fundingAccount: '',
        amount: MIN_FUND_AMOUNT,
    }
    fundErrors.value = {}
}

const handleClose = () => {
    resetForm()
    emit('close')
}

const confirmFund = () => {
    if (!validateFundForm() || submitting.value) return
    if (!props.selectedWallet?._id) {
        console.error('No wallet selected!')
        return
    }

    console.log(fundForm.value)

    submitting.value = true
    console.log('Selected wallet:', props.selectedWallet)

    emit('confirm', {
        walletId: props.selectedWallet._id,
        amount: Number(fundForm.value.amount),
        fundingAccount: fundForm.value.fundingAccount,
    })

    submitting.value = false
    handleClose()
}


// -------------------- Watchers --------------------
watch(() => fundForm.value.fundingAccount, v => {
    if (v) delete fundErrors.value.fundingAccount
})

watch(() => fundForm.value.amount, v => {
    if (v >= MIN_FUND_AMOUNT) delete fundErrors.value.amount
})

// -------------------- Lifecycle --------------------
onMounted(() => {
    if (!fundingAccountsStore.accounts.length) {
        fundingAccountsStore.fetchFundingAccounts()
    }
})
</script>

<template>
    <ConfirmModal :show="show" :title="`Fund ${selectedWallet?.name || ''} Wallet`" :loading="submitting"
        @close="handleClose" @confirm="confirmFund">
        <div class="space-y-4">
            <BaseSelect label="Funding Account" v-model="fundForm.fundingAccount"
                :options="fundingAccountsStore.accounts" :error="fundErrors.fundingAccount" />

            <BaseInput label="Amount" type="number" v-model="fundForm.amount" :min="MIN_FUND_AMOUNT" step="0.01"
                :error="fundErrors.amount" :hint="fundHints.amount" />
        </div>
    </ConfirmModal>
</template>
