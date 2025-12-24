import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'

import TransactionsView from '@/views/TransactionsView.vue'

const mountView = () =>
    mount(TransactionsView, {
        global: {
            stubs: {
                AppLayout: {
                    template: '<div><slot /></div>',
                },

                PageHeader: {
                    props: ['title', 'subtitle'],
                    template: `
            <header>
              <h1>{{ title }}</h1>
              <p>{{ subtitle }}</p>
            </header>
          `,
                },

                TransactionsList: {
                    template: '<div data-test="transactions-list" />',
                },
            },
        },
    })

describe('TransactionsView', () => {
    it('renders transactions page', () => {
        const wrapper = mountView()

        expect(wrapper.text()).toContain('Transactions')
        expect(wrapper.text()).toContain('View all your transactions history')
    })

    it('renders transactions list component', () => {
        const wrapper = mountView()

        expect(wrapper.find('[data-test="transactions-list"]').exists()).toBe(true)
    })
})
