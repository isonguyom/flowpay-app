import { describe, it, expect } from 'vitest'
import { generateIdempotencyKey } from '@/services/idempotency'

describe('Idempotency Service', () => {
    it('returns a string', () => {
        const key = generateIdempotencyKey()
        expect(typeof key).toBe('string')
    })

    it('returns a valid UUID v4', () => {
        const key = generateIdempotencyKey()

        const uuidV4Regex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

        expect(key).toMatch(uuidV4Regex)
    })

    it('generates unique keys on each call', () => {
        const key1 = generateIdempotencyKey()
        const key2 = generateIdempotencyKey()

        expect(key1).not.toBe(key2)
    })
})
