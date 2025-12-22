import { jest } from '@jest/globals'

/**
 * Mock socket.io Server
 */
const mockOn = jest.fn()
const mockEmit = jest.fn()

const mockSocket = {
    id: 'socket-123',
    on: jest.fn(),
    join: jest.fn(),
}

const mockIoInstance = {
    on: mockOn,
    emit: mockEmit,
}

jest.mock('socket.io', () => {
    return {
        Server: jest.fn(() => mockIoInstance),
    }
})

describe('Socket Service', () => {
    let initSocket
    let getSocket

    beforeEach(async () => {
        jest.clearAllMocks()
        jest.resetModules() // important for singleton reset

        const socketService = await import('../../../services/socket.js')
        initSocket = socketService.initSocket
        getSocket = socketService.getSocket
    })

    it('initializes socket.io server once', () => {
        const fakeServer = {}

        const io1 = initSocket(fakeServer)
        const io2 = initSocket(fakeServer)

        expect(io1).toBe(io2) // singleton behavior
        expect(io1).toBeDefined()
    })

    it('registers connection handler', () => {
        const fakeServer = {}
        initSocket(fakeServer)

        expect(mockOn).toHaveBeenCalledWith(
            'connection',
            expect.any(Function)
        )
    })

    it('handles joinRoom event correctly', () => {
        const fakeServer = {}
        initSocket(fakeServer)

        // Grab the connection callback
        const connectionHandler = mockOn.mock.calls.find(
            (call) => call[0] === 'connection'
        )[1]

        // Simulate client connection
        connectionHandler(mockSocket)

        // Find joinRoom handler
        const joinRoomHandler = mockSocket.on.mock.calls.find(
            (call) => call[0] === 'joinRoom'
        )[1]

        joinRoomHandler('user-123')

        expect(mockSocket.join).toHaveBeenCalledWith('user-123')
    })

    it('registers disconnect handler', () => {
        const fakeServer = {}
        initSocket(fakeServer)

        const connectionHandler = mockOn.mock.calls.find(
            (call) => call[0] === 'connection'
        )[1]

        connectionHandler(mockSocket)

        expect(mockSocket.on).toHaveBeenCalledWith(
            'disconnect',
            expect.any(Function)
        )
    })

    it('getSocket throws error if not initialized', async () => {
        await expect(() => getSocket()).toThrow(
            'Socket.io not initialized'
        )
    })

    it('getSocket returns initialized socket instance', () => {
        const fakeServer = {}
        const io = initSocket(fakeServer)

        const retrieved = getSocket()
        expect(retrieved).toBe(io)
    })
})
