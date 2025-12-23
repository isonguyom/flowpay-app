export function useHelpers() {

    /* ----------------------------------
     * Payment / Transaction Status
     * ---------------------------------- */
    const getStatusClass = (status) => {
        switch (status) {
            case 'Completed':
                return 'text-green-600'
            case 'Pending':
                return 'text-yellow-600'
            case 'Failed':
                return 'text-red-600'
            default:
                return 'text-gray-500'
        }
    }

    const getStatusLabel = (status) => {
        switch (status) {
            case 'Completed':
                return 'Completed'
            case 'Pending':
                return 'Pending'
            case 'Failed':
                return 'Failed'
            default:
                return 'Unknown'
        }
    }

    /* ----------------------------------
     * Wallet Status
     * ---------------------------------- */
    const getWalletStatusClass = (status) => {
        switch (status) {
            case 'Active':
                return 'text-green-600'
            case 'Suspended':
                return 'text-red-600'
            default:
                return 'text-gray-500'
        }
    }

    /* ----------------------------------
     * Mock API delay helper
     * ---------------------------------- */
    const simulateDelay = (ms = 1000) =>
        new Promise((resolve) => setTimeout(resolve, ms))

    return {
        getStatusClass,
        getStatusLabel,
        getWalletStatusClass,
        simulateDelay,
    }
}
