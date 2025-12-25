import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, beforeEach, expect, vi } from 'vitest'
import WalletList from '@/components/WalletList.vue'
import { useWalletStore } from '@/stores/wallets'

// Stub WalletCard so tests don’t depend on router or FX store
const WalletCardStub = {
    template: '<div><slot /></div>',
    props: ['wallet'],
    emits: ['fund', 'withdraw'],
}

describe('WalletList.vue', () => {
    let walletStore
    const mockWallets = [
        { _id: '1', name: 'USD Wallet', balance: 100, currency: 'USD' },
        { _id: '2', name: 'EUR Wallet', balance: 50, currency: 'EUR' },
    ]

    beforeEach(() => {
        setActivePinia(createPinia())
        walletStore = useWalletStore()
        walletStore.wallets = [...mockWallets]
        walletStore.loading = false
        walletStore.error = null
    })

    it('renders all wallets by default', () => {
        const wrapper = mount(WalletList, {
            global: {
                stubs: {
                    'WalletCard': WalletCardStub,
                    'router-link': true, // stub router-link
                },
            },
        })

        const walletCards = wrapper.findAllComponents(WalletCardStub)
        expect(walletCards.length).toBe(mockWallets.length)
        expect(wrapper.vm.totalBalance).toBe(150)
    })

    it('limits displayed wallets when maxItems prop is set', () => {
        const wrapper = mount(WalletList, {
            props: { maxItems: 1 },
            global: {
                stubs: {
                    'WalletCard': WalletCardStub,
                    'router-link': true,
                },
            },
        })

        const walletCards = wrapper.findAllComponents(WalletCardStub)
        expect(walletCards.length).toBe(1)
    })

    it('emits fund and withdraw events when WalletCard triggers them', async () => {
        const wrapper = mount(WalletList, {
            global: {
                stubs: {
                    'WalletCard': WalletCardStub,
                    'router-link': true,
                },
            },
        })

        const walletCards = wrapper.findAllComponents(WalletCardStub)
        const firstWallet = mockWallets[0]

        await walletCards[0].vm.$emit('fund', firstWallet)
        expect(wrapper.emitted()).toHaveProperty('fund')
        expect(wrapper.emitted('fund')[0]).toEqual([firstWallet])

        await walletCards[0].vm.$emit('withdraw', firstWallet)
        expect(wrapper.emitted()).toHaveProperty('withdraw')
        expect(wrapper.emitted('withdraw')[0]).toEqual([firstWallet])
    })
})
