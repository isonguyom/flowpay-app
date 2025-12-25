<script setup>
import { ref, watch } from 'vue'

import ConfirmModal from '@/components/utilities/ConfirmModal.vue'
import BaseInput from '@/components/utilities/BaseInput.vue'

import { MIN_WITHDRAW_AMOUNT } from '@/constants/walletConstants'

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

// -------------------- State --------------------
const withdrawForm = ref({
    beneficiary: '',
    amount: MIN_WITHDRAW_AMOUNT,
})

const withdrawErrors = ref({})
const submitting = ref(false)

// -------------------- Validation --------------------
const validateWithdrawForm = () => {
    withdrawErrors.value = {}

    if (!withdrawForm.value.beneficiary.trim()) {
        withdrawErrors.value.beneficiary = 'Beneficiary is required.'
    }

    if (withdrawForm.value.amount < MIN_WITHDRAW_AMOUNT) {
        withdrawErrors.value.amount = `Minimum amount is ${MIN_WITHDRAW_AMOUNT}.`
    }

    if (
        withdrawForm.value.amount >
        Number(props.selectedWallet?.balance || 0)
    ) {
        withdrawErrors.value.amount = 'Insufficient wallet balance.'
    }

    return Object.keys(withdrawErrors.value).length === 0
}

// -------------------- Actions --------------------
const resetForm = () => {
    withdrawForm.value = {
        beneficiary: '',
        amount: MIN_WITHDRAW_AMOUNT,
    }
    withdrawErrors.value = {}
}

const handleClose = () => {
    resetForm()
    emit('close')
}

const confirmWithdraw = () => {
    if (!validateWithdrawForm() || submitting.value) return

    submitting.value = true

    emit('confirm', {
        walletId: props.selectedWallet._id,
        beneficiary: withdrawForm.value.beneficiary.trim(),
        amount: Number(withdrawForm.value.amount),
    })

    submitting.value = false
    handleClose()
}

// -------------------- Watchers --------------------
watch(() => withdrawForm.value.beneficiary, v => {
    if (v) delete withdrawErrors.value.beneficiary
})

watch(() => withdrawForm.value.amount, v => {
    if (v >= MIN_WITHDRAW_AMOUNT) delete withdrawErrors.value.amount
})
</script>

<template>
    <ConfirmModal :show="show" :loading="submitting" :title="`Withdraw from ${selectedWallet?.name || ''} Wallet`"
        @close="handleClose" @confirm="confirmWithdraw">
        <div class="space-y-4">
            <BaseInput label="Beneficiary" v-model="withdrawForm.beneficiary" :error="withdrawErrors.beneficiary" />

            <BaseInput label="Amount" type="number" v-model="withdrawForm.amount" :min="MIN_WITHDRAW_AMOUNT" step="0.01"
                :error="withdrawErrors.amount" />

            <p class="text-xs text-gray-500">
                Available balance:
                <strong>{{ selectedWallet?.balance.toFixed(2) || '0.00' }}</strong>
            </p>
        </div>
    </ConfirmModal>
</template>
