import { getSocket } from '../services/socket.js'


/**
 * Helper to emit WebSocket events safely
 */
export const emitEvent = (userId, event, data) => {
    const socket = getSocket()
    if (socket && userId) socket.to(userId.toString()).emit(event, data)
}


/**
 * Helper to validate user authentication
 */
export const ensureAuthenticated = (req, res) => {
    if (!req.user?._id) {
        res.status(401).json({ message: 'Unauthorized' })
        return false
    }
    return true
}