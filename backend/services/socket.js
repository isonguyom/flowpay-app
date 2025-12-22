import { Server } from 'socket.io'

let io = null

/**
 * Initialize Socket.IO server
 * @param {import('http').Server} server - HTTP server instance
 */
export const initSocket = (server) => {
    if (io) return io // Prevent multiple initializations

    io = new Server(server, {
        cors: {
            origin: [
                'http://localhost:5173',
                'http://frontend:5173',
                'https://flowpayapp.vercel.app'
            ],
            methods: ['GET', 'POST', 'PUT'],
        },
        transports: ['websocket', 'polling'], // fallback enabled
    })


    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id)

        // Join user-specific room for targeted events
        socket.on('joinRoom', (userId) => {
            socket.join(userId)
            console.log(`Socket ${socket.id} joined room ${userId}`)
        })

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id)
        })
    })

    return io
}

/**
 * Get initialized Socket instance
 */
export const getSocket = () => {
    if (!io) {
        throw new Error('Socket.io not initialized. Call initSocket(server) first.')
    }
    return io
}
