import { ref, watch } from 'vue'
import { MIN_FUND_AMOUNT, MIN_WITHDRAW_AMOUNT } from '@/constants/walletConstants'

export function useWalletValidation(fundForm, withdrawForm) {
    const fundErrors = ref({})
    const withdrawErrors = ref({})

    const validateFundForm = () => {
        fundErrors.value = {}

        if (!fundForm.value.fundingAccount) {
            fundErrors.value.fundingAccount = 'Funding account is required.'
        }

        if (Number(fundForm.value.amount) < MIN_FUND_AMOUNT) {
            fundErrors.value.amount = `Minimum amount is ${MIN_FUND_AMOUNT}.`
        }

        return Object.keys(fundErrors.value).length === 0
    }

    const validateWithdrawForm = () => {
        withdrawErrors.value = {}

        if (!withdrawForm.value.recipient) {
            withdrawErrors.value.recipient = 'Recipient is required.'
        }

        if (Number(withdrawForm.value.amount) < MIN_WITHDRAW_AMOUNT) {
            withdrawErrors.value.amount = `Minimum amount is ${MIN_WITHDRAW_AMOUNT}.`
        }

        return Object.keys(withdrawErrors.value).length === 0
    }

    /* Auto-clear errors */
    watch(() => fundForm.value.fundingAccount, v => v && delete fundErrors.value.fundingAccount)
    watch(() => fundForm.value.amount, v => v >= MIN_FUND_AMOUNT && delete fundErrors.value.amount)

    watch(() => withdrawForm.value.recipient, v => v && delete withdrawErrors.value.recipient)
    watch(() => withdrawForm.value.amount, v => v >= MIN_WITHDRAW_AMOUNT && delete withdrawErrors.value.amount)

    return {
        fundErrors,
        withdrawErrors,
        validateFundForm,
        validateWithdrawForm,
    }
}
