import { v4 as uuidv4 } from 'uuid'

/**
 * Generates a unique idempotency key
 * Used to prevent duplicate request processing
 */
export function generateIdempotencyKey() {
    return uuidv4()
}
