import { jest } from '@jest/globals';
import * as dbService from '../../../services/db.js';

describe('DB Service (functional version)', () => {
    let mongooseMock;

    beforeEach(() => {
        // Reset connection state before each test
        dbService.__resetConnectionState();

        // Mock mongoose methods
        mongooseMock = {
            connect: jest.fn().mockResolvedValue(true),
            disconnect: jest.fn().mockResolvedValue(true),
        };

        // Mock console
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('connectDB', () => {
        it('connects to MongoDB when called', async () => {
            await dbService.connectDB(mongooseMock);

            expect(mongooseMock.connect).toHaveBeenCalledTimes(1);
            expect(console.log).toHaveBeenCalledWith('✅ MongoDB connected');
        });

        it('does not reconnect if called multiple times', async () => {
            await dbService.connectDB(mongooseMock); // first call
            await dbService.connectDB(mongooseMock); // second call should not call mongoose.connect again

            expect(mongooseMock.connect).toHaveBeenCalledTimes(1); // guard works
        });

        it('handles connection errors gracefully', async () => {
            const error = new Error('Connection failed');
            mongooseMock.connect.mockRejectedValueOnce(error);

            // Since process.exit is called in original, we need to mock it for test
            const spyExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw error; });

            await expect(dbService.connectDB(mongooseMock)).rejects.toThrow(error);
            expect(console.error).toHaveBeenCalledWith('❌ MongoDB connection error:', error);

            spyExit.mockRestore();
        });
    });

    describe('disconnectDB', () => {
        it('disconnects if connected', async () => {
            await dbService.connectDB(mongooseMock);
            await dbService.disconnectDB(mongooseMock);

            expect(mongooseMock.disconnect).toHaveBeenCalledTimes(1);
            expect(console.log).toHaveBeenCalledWith('🔌 MongoDB disconnected');
        });

        it('does nothing if not connected', async () => {
            await dbService.disconnectDB(mongooseMock);

            expect(mongooseMock.disconnect).not.toHaveBeenCalled();
        });

        it('handles disconnect errors gracefully', async () => {
            await dbService.connectDB(mongooseMock);

            const error = new Error('Disconnect failed');
            mongooseMock.disconnect.mockRejectedValueOnce(error);

            await dbService.disconnectDB(mongooseMock);

            expect(console.error).toHaveBeenCalledWith('❌ Error disconnecting MongoDB:', error);
        });
    });
});
