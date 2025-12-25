import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, beforeEach, expect, vi } from 'vitest'
import FundWallet from '@/components/modals/FundWalletModal.vue'
import { useFundingAccountsStore } from '@/stores/fundingAccounts'
import { MIN_FUND_AMOUNT } from '@/constants/walletConstants'

// Stub child components
const ConfirmModalStub = {
    template: '<div><slot /></div>',
    props: ['show', 'title', 'loading'],
    emits: ['close', 'confirm'],
}

const BaseSelectStub = {
    template: '<select><slot /></select>',
    props: ['label', 'options', 'error', 'modelValue'],
    emits: ['update:modelValue'],
}

const BaseInputStub = {
    template: '<input />',
    props: ['label', 'type', 'min', 'step', 'error', 'hint', 'modelValue'],
    emits: ['update:modelValue'],
}

describe('FundWallet.vue', () => {
    let fundingStore
    const mockWallet = { _id: 'abc123', name: 'USD Wallet' }

    beforeEach(() => {
        setActivePinia(createPinia())
        fundingStore = useFundingAccountsStore()
        fundingStore.accounts = ['bank_main', 'bank_savings']
        fundingStore.fetchFundingAccounts = vi.fn()
    })

    it('renders the funding accounts and amount field', () => {
        const wrapper = mount(FundWallet, {
            props: { show: true, selectedWallet: mockWallet },
            global: {
                stubs: {
                    ConfirmModal: ConfirmModalStub,
                    BaseSelect: BaseSelectStub,
                    BaseInput: BaseInputStub,
                },
            },
        })

        // Check that the ConfirmModal title prop contains wallet name
        const modal = wrapper.findComponent(ConfirmModalStub)
        expect(modal.props('title')).toBe('Fund USD Wallet Wallet')

        // Check that the amount and fundingAccount values are correct
        expect(wrapper.vm.fundForm.amount).toBe(MIN_FUND_AMOUNT)
        expect(wrapper.vm.fundForm.fundingAccount).toBe('')
    })

    it('validates form and sets errors if empty', async () => {
        const wrapper = mount(FundWallet, {
            props: { show: true, selectedWallet: mockWallet },
            global: {
                stubs: {
                    ConfirmModal: ConfirmModalStub,
                    BaseSelect: BaseSelectStub,
                    BaseInput: BaseInputStub,
                },
            },
        })

        wrapper.vm.fundForm.fundingAccount = ''
        wrapper.vm.fundForm.amount = MIN_FUND_AMOUNT - 1

        expect(wrapper.vm.validateFundForm()).toBe(false)
        expect(wrapper.vm.fundErrors.fundingAccount).toBe('Funding account is required.')
        expect(wrapper.vm.fundErrors.amount).toBe(`Minimum amount is ${MIN_FUND_AMOUNT}.`)
    })

    it('emits confirm event with correct payload', async () => {
        const wrapper = mount(FundWallet, {
            props: { show: true, selectedWallet: mockWallet },
            global: {
                stubs: {
                    ConfirmModal: ConfirmModalStub,
                    BaseSelect: BaseSelectStub,
                    BaseInput: BaseInputStub,
                },
            },
        })

        wrapper.vm.fundForm.fundingAccount = 'bank_main'
        wrapper.vm.fundForm.amount = 500

        await wrapper.vm.confirmFund()

        expect(wrapper.emitted()).toHaveProperty('confirm')
        expect(wrapper.emitted('confirm')[0][0]).toEqual({
            walletId: 'abc123',
            amount: 500,
            fundingAccount: 'bank_main',
        })

        // form should reset after confirm
        expect(wrapper.vm.fundForm.fundingAccount).toBe('')
        expect(wrapper.vm.fundForm.amount).toBe(MIN_FUND_AMOUNT)
    })

    it('calls handleClose and emits close', async () => {
        const wrapper = mount(FundWallet, {
            props: { show: true, selectedWallet: mockWallet },
            global: {
                stubs: {
                    ConfirmModal: ConfirmModalStub,
                    BaseSelect: BaseSelectStub,
                    BaseInput: BaseInputStub,
                },
            },
        })

        await wrapper.vm.handleClose()
        expect(wrapper.emitted()).toHaveProperty('close')
        expect(wrapper.vm.fundForm.fundingAccount).toBe('')
    })
})
