// composables/useValidators.js
export function useValidators() {
    // ------------------------
    // Validate Required Field
    // ------------------------
    const validateRequired = (value, message = 'This field is required') => {
        return value != null && String(value).trim() !== '' ? null : message
    }

    // ------------------------
    // Validate Email
    // ------------------------
    const validateEmail = (value, message = 'Invalid email address') => {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return pattern.test(value) ? null : message
    }

    // ------------------------
    // Validate Minimum Length
    // ------------------------
    const validateMinLength = (value, length, message) => {
        return value && value.length >= length
            ? null
            : message || `Must be at least ${length} characters`
    }

    // ------------------------
    // Validate Maximum Length
    // ------------------------
    const validateMaxLength = (value, length, message) => {
        return value && value.length <= length
            ? null
            : message || `Must be at most ${length} characters`
    }

    // ------------------------
    // Validate Number Range
    // ------------------------
    const validateNumberRange = (value, min, max, message) => {
        if (value == null || value === '') return null
        const num = Number(value)
        if (isNaN(num)) return message || 'Must be a number'
        if (num < min || num > max) return message || `Must be between ${min} and ${max}`
        return null
    }

    // ------------------------
    // Validate Regex Pattern
    // ------------------------
    const validatePattern = (value, pattern, message) => {
        return pattern.test(value) ? null : message || 'Invalid format'
    }

    return {
        validateRequired,
        validateEmail,
        validateMinLength,
        validateMaxLength,
        validateNumberRange,
        validatePattern,
    }
}
