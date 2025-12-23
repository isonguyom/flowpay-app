import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('API Service', () => {
    let mockAxiosInstance
    let axios
    let api

    beforeEach(async () => {
        mockAxiosInstance = {
            interceptors: {
                request: { use: vi.fn() },
                response: { use: vi.fn() },
            },
        }

        vi.doMock('axios', () => ({
            default: {
                create: vi.fn(() => mockAxiosInstance),
            },
        }))

        axios = (await import('axios')).default
        api = (await import('@/services/api')).default
    })

    afterEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
        vi.resetModules()
    })

    it('creates axios instance with correct baseURL', () => {
        expect(axios.create).toHaveBeenCalledWith(
            expect.objectContaining({
                baseURL: expect.stringContaining('/api'),
                headers: {
                    'Content-Type': 'application/json',
                },
            })
        )
    })

    it('registers request and response interceptors', () => {
        expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled()
        expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled()
    })

    it('adds Authorization header when token exists', () => {
        localStorage.setItem('token', 'test-token')

        const requestInterceptor =
            mockAxiosInstance.interceptors.request.use.mock.calls[0][0]

        const config = { headers: {} }
        const result = requestInterceptor(config)

        expect(result.headers.Authorization).toBe('Bearer test-token')
    })

    it('does not add Authorization header when token is missing', () => {
        const requestInterceptor =
            mockAxiosInstance.interceptors.request.use.mock.calls[0][0]

        const config = { headers: {} }
        const result = requestInterceptor(config)

        expect(result.headers.Authorization).toBeUndefined()
    })

    it('passes successful responses through unchanged', () => {
        const responseInterceptor =
            mockAxiosInstance.interceptors.response.use.mock.calls[0][0]

        const response = { data: { ok: true } }
        expect(responseInterceptor(response)).toBe(response)
    })

    it('rejects errors from response interceptor', async () => {
        const errorInterceptor =
            mockAxiosInstance.interceptors.response.use.mock.calls[0][1]

        const error = { response: { data: { message: 'Error occurred' } } }

        await expect(errorInterceptor(error)).rejects.toBe(error)
    })
})
