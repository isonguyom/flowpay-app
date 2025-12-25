import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import WalletCard from '@/components/cards/WalletCard.vue'

// -------------------- Mock composables --------------------
vi.mock('@/composables/useFx', () => ({
    useFx: () => ({
        convert: vi.fn((amount) => amount), // simple identity function
    }),
}))

vi.mock('@/composables/useUtils', () => ({
    useUtils: () => ({
        formatCurrencyCompact: (amount) => `$${amount.toFixed(2)}`,
    }),
}))

// -------------------- Mock fxStore --------------------
vi.mock('@/stores/fx', () => ({
    useFxStore: () => ({
        fxList: ref([{ value: 'USD' }]),
        feeRate: ref(0),
        loading: ref(false),
        fetchFx: vi.fn(),
    }),
}))

// -------------------- Mock wallet --------------------
const mockWallet = {
    currency: 'USD',
    balance: 1234.56,
    color: '#00FF00',
}

describe('WalletCard.vue', () => {
    beforeEach(() => {
        const pinia = createPinia()
        setActivePinia(pinia)
    })

    it('renders wallet currency and balance', () => {
        const wrapper = mount(WalletCard, { props: { wallet: mockWallet } })
        expect(wrapper.text()).toContain('USD Wallet')
        expect(wrapper.text()).toContain('$1234.56')
    })

    it('toggles visibility of balance', async () => {
        const wrapper = mount(WalletCard, { props: { wallet: mockWallet } })
        const toggleButton = wrapper.find('button')

        // Initially visible
        expect(wrapper.text()).toContain('$1234.56')

        // Hide balance
        await toggleButton.trigger('click')
        expect(wrapper.text()).toContain('•••••')

        // Show balance again
        await toggleButton.trigger('click')
        expect(wrapper.text()).toContain('$1234.56')
    })

    it('emits fund and withdraw events correctly', async () => {
        const wrapper = mount(WalletCard, { props: { wallet: mockWallet } })
        const buttons = wrapper.findAll('button')

        // Fund button (second button in template)
        await buttons[1].trigger('click')
        expect(wrapper.emitted('fund')).toBeTruthy()
        expect(wrapper.emitted('fund')[0]).toEqual([mockWallet])

        // Withdraw button (third button in template)
        await buttons[2].trigger('click')
        expect(wrapper.emitted('withdraw')).toBeTruthy()
        expect(wrapper.emitted('withdraw')[0]).toEqual([mockWallet])
    })

    it('displays converted USD balance correctly', () => {
        const wrapper = mount(WalletCard, { props: { wallet: mockWallet } })
        const usdSpan = wrapper.find('p span')

        // Remove spaces in the string to match expected format
        expect(usdSpan.text().replace(/\s/g, '')).toBe('1234.56')
    })
})
