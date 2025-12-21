// ---- KNOWN / SUPPORTED CURRENCIES ----
export const currencies = {
    USD: { label: 'US Dollar', symbol: '$', color: '#16a34a', offlineRate: 1, defaultRate: 1 },
    NGN: { label: 'Nigerian Naira', symbol: '₦', color: '#0ea5e9', offlineRate: 1500, defaultRate: 1500 },
    EUR: { label: 'Euro', symbol: '€', color: '#2563eb', defaultRate: 1.1 },
    GBP: { label: 'British Pound', symbol: '£', color: '#7c3aed', defaultRate: 1.3 },
    JPY: { label: 'Japanese Yen', symbol: '¥', color: '#dc2626', defaultRate: 150 },
    AUD: { label: 'Australian Dollar', symbol: 'A$', color: '#f59e0b', defaultRate: 1.5 },
    CAD: { label: 'Canadian Dollar', symbol: 'C$', color: '#ef4444', defaultRate: 1.25 },
    BRL: { label: 'Brazilian Real', symbol: 'R$', color: '#22c55e', defaultRate: 5.5 },
    CHF: { label: 'Swiss Franc', symbol: 'CHF', color: '#64748b', defaultRate: 1.05 },
    CNY: { label: 'Chinese Yuan', symbol: '¥', color: '#f97316', defaultRate: 7 },
    INR: { label: 'Indian Rupee', symbol: '₹', color: '#eab308', defaultRate: 85 },
    ZAR: { label: 'South African Rand', symbol: 'R', color: '#8b5cf6', defaultRate: 17 },
    SEK: { label: 'Swedish Krona', symbol: 'kr', color: '#10b981', defaultRate: 11 },
    NOK: { label: 'Norwegian Krone', symbol: 'kr', color: '#3b82f6', defaultRate: 11 },
    MXN: { label: 'Mexican Peso', symbol: '$', color: '#f43f5e', defaultRate: 20 },
    SGD: { label: 'Singapore Dollar', symbol: 'S$', color: '#14b8a6', defaultRate: 1.35 },
    HKD: { label: 'Hong Kong Dollar', symbol: 'HK$', color: '#8b5cf6', defaultRate: 7.8 },
    NZD: { label: 'New Zealand Dollar', symbol: 'NZ$', color: '#f97316', defaultRate: 1.6 },
    KRW: { label: 'South Korean Won', symbol: '₩', color: '#ef4444', defaultRate: 1300 },
    TRY: { label: 'Turkish Lira', symbol: '₺', color: '#facc15', defaultRate: 28 },
    RUB: { label: 'Russian Ruble', symbol: '₽', color: '#2563eb', defaultRate: 80 },
};

// ---- MODE CONTROL ----
export const CURRENCY_MODE = {
    STRICT: 'STRICT', // only currencies defined in this file
    OPEN: 'OPEN',     // allow all ISO-4217 currencies
};


// Active mode from ENV (default to STRICT)
export const ACTIVE_CURRENCY_MODE =
    process.env.CURRENCY_MODE === 'OPEN'
        ? CURRENCY_MODE.OPEN
        : CURRENCY_MODE.STRICT;

// ---- HELPERS ----
export const DEFAULT_CURRENCY = process.env.BASE_CURRENCY || 'USD';


export function isValidISO(currency) {
    return /^[A-Z]{3}$/.test(currency);
}

/**
 * Check if a currency is allowed by platform rules
 */
export function isCurrencyAllowed(currency) {
    if (!currency) return false;

    const code = currency.toUpperCase();

    if (!isValidISO(code)) return false;

    if (ACTIVE_CURRENCY_MODE === CURRENCY_MODE.OPEN) {
        return true;
    }

    return Boolean(currencies[code]);
}

/**
 * Get currency metadata safely
 * Falls back to USD if currency is invalid or removed
 */
export function getCurrencyMeta(currency) {
    const code = currency?.toUpperCase();
    const meta = (code && isCurrencyAllowed(code) && currencies[code])
        ? currencies[code]
        : currencies[DEFAULT_CURRENCY];

    return {
        ...meta,
        flaggedRate: meta.offlineRate ?? meta.defaultRate,
    };
}


/**
 * List currencies visible to users (for dropdowns, UI)
 */
export function listSupportedCurrencies() {
    return Object.keys(currencies);
}

/**
 * Ensure default currency is always valid
 */
export function sanitizeCurrency(currency) {
    return isCurrencyAllowed(currency) && currencies[currency.toUpperCase()]
        ? currency.toUpperCase()
        : DEFAULT_CURRENCY;
}
