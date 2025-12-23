import { getSocket } from '../services/socket.js'


// --------------------
// Socket helper
// --------------------
export const emit = (userId, event, payload) => {
    try {
        getSocket()?.to(userId.toString()).emit(event, payload)
    } catch (err) {
        console.error(`Socket emit failed [${event}]`, err)
    }
}