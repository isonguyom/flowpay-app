/**
 * Normalize transaction status from query string
 * e.g. "pending" → "Pending"
 */
export const normalizeStatus = (status) =>
    status
        ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
        : undefined

/**
 * Build MongoDB transaction query safely
 */
export const buildTransactionQuery = ({
    userId,
    type,
    status,
    startDate,
    endDate
}) => {
    const query = { userId }

    if (type) {
        query.type = type.toUpperCase()
    }

    if (status) {
        query.status = normalizeStatus(status)
    }

    if (startDate || endDate) {
        query.createdAt = {}

        if (startDate && !isNaN(new Date(startDate))) {
            query.createdAt.$gte = new Date(startDate)
        }

        if (endDate && !isNaN(new Date(endDate))) {
            query.createdAt.$lte = new Date(endDate)
        }
    }

    return query
}
