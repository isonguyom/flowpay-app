// =======================================================
// FX CURRENCY CONFIGURATION
// -------------------------------------------------------
// RULES:
// 1. ALL rates are expressed as: 1 USD = X currency
// 2. USD is the global FX bridge currency
// 3. No implicit fallbacks, no rate = 1 hacks
// 4. Non-USD bases MUST normalize via USD
// =======================================================

/**
 * Global FX bridge currency
 * DO NOT change without auditing the entire FX system
 */
export const FX_BRIDGE_CURRENCY = 'USD';

/**
 * ---- KNOWN / SUPPORTED CURRENCIES ----
 * Rates are approximate and intentionally conservative.
 * These are NOT trading rates — they are fallback / safety rates.
 */
export const currencies = {
    USD: { label: 'US Dollar', symbol: '$', color: '#16a34a', defaultRate: 1, offlineRate: 1 },
    EUR: { label: 'Euro', symbol: '€', color: '#2563eb', defaultRate: 0.92 },
    GBP: { label: 'British Pound', symbol: '£', color: '#7c3aed', defaultRate: 0.79 },
    CHF: { label: 'Swiss Franc', symbol: 'CHF', color: '#64748b', defaultRate: 0.88 },
    // NGN: { label: 'Nigerian Naira', symbol: '₦', color: '#0ea5e9', defaultRate: 1500, offlineRate: 1500 },
    ZAR: { label: 'South African Rand', symbol: 'R', color: '#8b5cf6', defaultRate: 18.5 },
    JPY: { label: 'Japanese Yen', symbol: '¥', color: '#dc2626', defaultRate: 148 },
    KRW: { label: 'South Korean Won', symbol: '₩', color: '#ef4444', defaultRate: 1320 },
    AUD: { label: 'Australian Dollar', symbol: 'A$', color: '#f59e0b', defaultRate: 1.52 },
    CAD: { label: 'Canadian Dollar', symbol: 'C$', color: '#ef4444', defaultRate: 1.36 },
    NZD: { label: 'New Zealand Dollar', symbol: 'NZ$', color: '#f97316', defaultRate: 1.63 },
    CNY: { label: 'Chinese Yuan', symbol: '¥', color: '#f97316', defaultRate: 7.25 },
    INR: { label: 'Indian Rupee', symbol: '₹', color: '#eab308', defaultRate: 83.2 },
    SGD: { label: 'Singapore Dollar', symbol: 'S$', color: '#14b8a6', defaultRate: 1.34 },
    HKD: { label: 'Hong Kong Dollar', symbol: 'HK$', color: '#8b5cf6', defaultRate: 7.82 },
    SEK: { label: 'Swedish Krona', symbol: 'kr', color: '#10b981', defaultRate: 10.6 },
    NOK: { label: 'Norwegian Krone', symbol: 'kr', color: '#3b82f6', defaultRate: 10.8 },
    MXN: { label: 'Mexican Peso', symbol: '$', color: '#f43f5e', defaultRate: 17.1 },
    BRL: { label: 'Brazilian Real', symbol: 'R$', color: '#22c55e', defaultRate: 4.95 },
    TRY: { label: 'Turkish Lira', symbol: '₺', color: '#facc15', defaultRate: 30 },
    RUB: { label: 'Russian Ruble', symbol: '₽', color: '#2563eb', defaultRate: 92 },
};

/**
 * ---- LEGACY / UNSUPPORTED CURRENCIES ----
 * May appear from API, but are not allowed in strict mode.
 */
export const legacyCurrencies = {
    ABC: { label: 'Legacy ABC', symbol: 'A$', color: '#999999', usdRate: 1.5 },
    XYZ: { label: 'Legacy XYZ', symbol: 'X$', color: '#666666', usdRate: 2.3 },
};


// =======================================================
// MODE CONTROL
// =======================================================

export const CURRENCY_MODE = {
    STRICT: 'STRICT', // only currencies defined above
    OPEN: 'OPEN',     // allow any ISO-4217 (not recommended for payments)
};

export const ACTIVE_CURRENCY_MODE =
    process.env.CURRENCY_MODE === 'OPEN'
        ? CURRENCY_MODE.OPEN
        : CURRENCY_MODE.STRICT;

// =======================================================
// DEFAULTS
// =======================================================

export const DEFAULT_CURRENCY = process.env.BASE_CURRENCY || FX_BRIDGE_CURRENCY;

// =======================================================
// VALIDATION HELPERS
// =======================================================

export function isValidISO(currency) {
    return /^[A-Z]{3}$/.test(currency);
}

export function isCurrencyAllowed(currency) {
    if (!currency) return false;

    const code = currency.toUpperCase();
    if (!isValidISO(code)) return false;

    if (ACTIVE_CURRENCY_MODE === CURRENCY_MODE.OPEN) {
        return true;
    }

    return Boolean(currencies[code]);
}

// =======================================================
// METADATA & RATE ACCESS (USD-BASED ONLY)
// =======================================================

export function getCurrencyMeta(currency) {
    const code = currency?.toUpperCase();

    if (!code) return currencies[FX_BRIDGE_CURRENCY];

    if (currencies[code]) {
        const meta = currencies[code];
        const usdRate = meta.offlineRate ?? meta.defaultRate;
        if (!usdRate || usdRate <= 0) throw new Error(`Invalid USD rate for ${code}`);
        return { code, label: meta.label, symbol: meta.symbol, color: meta.color, usdRate, rateBase: FX_BRIDGE_CURRENCY, isOffline: Boolean(meta.offlineRate) };
    }

    // Only allow legacy currencies explicitly
    if (legacyCurrencies[code]) return { ...legacyCurrencies[code], code, rateBase: FX_BRIDGE_CURRENCY };

    // Otherwise unsupported
    throw new Error(`Unsupported currency: ${code}`);
}


// =======================================================
// NORMALIZATION (USD → BASE → TARGET)
// =======================================================

export function normalizeRateToBase(targetCurrency, baseCurrency) {
    const target = getCurrencyMeta(targetCurrency);
    const base = getCurrencyMeta(baseCurrency);

    return target.usdRate / base.usdRate;
}

// =======================================================
// FRONTEND-SAFE FX PAYLOAD HELPERS
// =======================================================

export function getFxContext(baseCurrency) {
    const base = getCurrencyMeta(baseCurrency);

    return {
        fxBase: base.code,
        fxBridge: FX_BRIDGE_CURRENCY,
        baseUsdRate: base.usdRate,
        normalized: base.code !== FX_BRIDGE_CURRENCY,
    };
}

// =======================================================
// UI HELPERS
// =======================================================

export function listSupportedCurrencies() {
    return Object.keys(currencies);
}

export function sanitizeCurrency(currency) {
    return isCurrencyAllowed(currency) && currencies[currency.toUpperCase()]
        ? currency.toUpperCase()
        : DEFAULT_CURRENCY;
}

// =======================================================
// SUPPORTED CURRENCY LIST (STRICT MODE)
// =======================================================
export const SUPPORTED_CURRENCIES = Object.keys(currencies);
