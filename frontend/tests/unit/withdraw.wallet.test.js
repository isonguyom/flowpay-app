import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import WithdrawWallet from '@/components/modals/WithdrawWalletModal.vue'
import ConfirmModal from '@/components/utilities/ConfirmModal.vue'
import BaseInput from '@/components/utilities/BaseInput.vue'
import { MIN_WITHDRAW_AMOUNT } from '@/constants/walletConstants'

// -------------------- Stubs --------------------
const ConfirmModalStub = {
    template: '<div><slot /></div>',
    props: ['show', 'title', 'loading'],
}

const BaseInputStub = {
    template: '<input />',
    props: ['label', 'modelValue', 'error', 'type', 'min', 'step'],
}

// -------------------- Mock wallet --------------------
const mockWallet = {
    _id: 'wallet1',
    name: 'USD Wallet',
    balance: 100,
}

describe('WithdrawWallet.vue', () => {
    let wrapper

    beforeEach(() => {
        wrapper = mount(WithdrawWallet, {
            props: { show: true, selectedWallet: mockWallet },
            global: {
                stubs: {
                    ConfirmModal: ConfirmModalStub,
                    BaseInput: BaseInputStub,
                },
            },
        })
    })

    it('renders ConfirmModal with correct title and initial form values', () => {
        const modal = wrapper.findComponent(ConfirmModalStub)
        expect(modal.props('title')).toBe('Withdraw from USD Wallet Wallet')

        expect(wrapper.vm.withdrawForm.amount).toBe(MIN_WITHDRAW_AMOUNT)
        expect(wrapper.vm.withdrawForm.beneficiary).toBe('')
    })

    it('validates form and sets errors if beneficiary is empty or amount invalid', async () => {
        wrapper.vm.withdrawForm.beneficiary = ''
        wrapper.vm.withdrawForm.amount = MIN_WITHDRAW_AMOUNT - 1

        const isValid = wrapper.vm.validateWithdrawForm()
        expect(isValid).toBe(false)
        expect(wrapper.vm.withdrawErrors.beneficiary).toBe('Beneficiary is required.')
        expect(wrapper.vm.withdrawErrors.amount).toBe(`Minimum amount is ${MIN_WITHDRAW_AMOUNT}.`)

        // Amount exceeds wallet balance
        wrapper.vm.withdrawForm.amount = 200
        wrapper.vm.withdrawForm.beneficiary = 'Alice'
        const valid2 = wrapper.vm.validateWithdrawForm()
        expect(valid2).toBe(false)
        expect(wrapper.vm.withdrawErrors.amount).toBe('Insufficient wallet balance.')
    })

    it('emits confirm event with correct payload when form is valid', async () => {
        wrapper.vm.withdrawForm.beneficiary = 'Alice'
        wrapper.vm.withdrawForm.amount = 50

        await wrapper.vm.confirmWithdraw()

        expect(wrapper.emitted('confirm')).toBeTruthy()
        expect(wrapper.emitted('confirm')[0][0]).toEqual({
            walletId: 'wallet1',
            beneficiary: 'Alice',
            amount: 50,
        })
        expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('calls handleClose and emits close', async () => {
        await wrapper.vm.handleClose()
        expect(wrapper.emitted('close')).toBeTruthy()
        expect(wrapper.vm.withdrawForm.beneficiary).toBe('')
        expect(wrapper.vm.withdrawForm.amount).toBe(MIN_WITHDRAW_AMOUNT)
    })
})
