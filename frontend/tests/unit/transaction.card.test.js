import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import TransactionItem from '@/components/cards/TransactionCard.vue'

// ------------------ MOCKS ------------------
const formatCurrencyCompact = vi.fn((amount, currency) => `${currency} ${amount}`)
const formatDate = vi.fn((date) => `formatted-${date}`)
const getStatusClass = vi.fn((status) => `status-${status}`)

vi.mock('@/composables/useUtils', () => ({
    useUtils: () => ({ formatCurrencyCompact, formatDate }),
}))

vi.mock('@/composables/useHelpers', () => ({
    useHelpers: () => ({ getStatusClass }),
}))

// ------------------ TESTS ------------------
describe('TransactionCard.vue', () => {

    it('renders FUND transaction correctly', () => {
        const transaction = {
            type: 'FUND',
            createdAt: '2025-12-24T00:00:00Z',
            status: 'COMPLETED',
            sourceCurrency: 'USD',
            amount: 100,
            fundingAccount: 'Bank A',
        }

        const wrapper = mount(TransactionItem, { props: { transaction } })
        const meta = wrapper.vm.meta

        expect(meta.title).toBe('USD Wallet Funding')
        expect(meta.subtitle).toBe('Bank A')
        expect(meta.amount).toBe('USD 100')
        expect(meta.status).toBe('COMPLETED')

        expect(wrapper.text()).toContain('USD Wallet Funding')
        expect(wrapper.text()).toContain('Bank A')
        expect(wrapper.text()).toContain('formatted-2025-12-24T00:00:00Z')
        expect(wrapper.text()).toContain('USD 100')
        expect(wrapper.text()).toContain('COMPLETED')
    })

    it('renders WITHDRAW transaction correctly', () => {
        const transaction = {
            type: 'WITHDRAW',
            createdAt: '2025-12-24T00:00:00Z',
            status: 'PENDING',
            sourceCurrency: 'EUR',
            amount: 200,
            recipient: 'User B',
        }

        const wrapper = mount(TransactionItem, { props: { transaction } })
        const meta = wrapper.vm.meta

        expect(meta.title).toBe('EUR Wallet Withdrawal')
        expect(meta.subtitle).toBe('User B')
        expect(meta.amount).toBe('EUR 200')
        expect(meta.status).toBe('PENDING')

        expect(wrapper.text()).toContain('EUR Wallet Withdrawal')
        expect(wrapper.text()).toContain('User B')
        expect(wrapper.text()).toContain('formatted-2025-12-24T00:00:00Z')
        expect(wrapper.text()).toContain('EUR 200')
        expect(wrapper.text()).toContain('PENDING')
    })

    it('renders PAYMENT transaction correctly', () => {
        const transaction = {
            type: 'PAYMENT',
            createdAt: '2025-12-24T00:00:00Z',
            status: 'FAILED',
            sourceCurrency: 'USD',
            destinationCurrency: 'NGN',
            amount: 150,
            settlementAmount: 75000,
            beneficiary: 'Merchant X',
        }

        const wrapper = mount(TransactionItem, { props: { transaction } })
        const meta = wrapper.vm.meta

        expect(meta.title).toBe('USD → NGN Payment')
        expect(meta.subtitle).toBe('Merchant X')
        expect(meta.amount).toBe('USD 150 → NGN 75000')
        expect(meta.status).toBe('FAILED')

        expect(wrapper.text()).toContain('USD → NGN Payment')
        expect(wrapper.text()).toContain('Merchant X')
        expect(wrapper.text()).toContain('formatted-2025-12-24T00:00:00Z')
        expect(wrapper.text()).toContain('USD 150 → NGN 75000')
        expect(wrapper.text()).toContain('FAILED')
    })

    it('falls back to default subtitle when missing', () => {
        const transaction = {
            type: 'FUND',
            createdAt: '2025-12-24T00:00:00Z',
            status: 'COMPLETED',
            sourceCurrency: 'USD',
            amount: 100,
        }

        const wrapper = mount(TransactionItem, { props: { transaction } })
        const meta = wrapper.vm.meta
        expect(meta.subtitle).toBe('External Account')
    })
})
