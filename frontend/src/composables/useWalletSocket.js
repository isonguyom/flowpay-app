import { onBeforeUnmount, onMounted } from 'vue'
import { initSocket, getSocket } from '@/services/socket'

export function useWalletSocket({
    onCreated,
    onUpdated,
    autoConnect = true,
}) {
    let socket = null

    const bindListeners = () => {
        if (!socket) return

        // Always clean before binding (prevents duplicates)
        socket.off('walletCreated', onCreated)
        socket.off('walletUpdated', onUpdated)

        socket.on('walletCreated', onCreated)
        socket.on('walletUpdated', onUpdated)
    }

    const unbindListeners = () => {
        if (!socket) return
        socket.off('walletCreated', onCreated)
        socket.off('walletUpdated', onUpdated)
    }

    onMounted(() => {
        if (!autoConnect) return

        try {
            socket = getSocket()
        } catch {
            socket = initSocket()
        }

        bindListeners()
    })

    onBeforeUnmount(() => {
        unbindListeners()
    })

    return {
        getSocket: () => socket,
        bindListeners,
        unbindListeners,
    }
}
