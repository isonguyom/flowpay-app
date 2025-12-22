import axios from 'axios';
import {
    currencies,
    legacyCurrencies,
    DEFAULT_CURRENCY,
    FX_BRIDGE_CURRENCY,
    isCurrencyAllowed,
    getCurrencyMeta,
    normalizeRateToBase,
    SUPPORTED_CURRENCIES,
    ACTIVE_CURRENCY_MODE,
    CURRENCY_MODE,
} from '../config/currenciesConfig.js';

/**
 * Round to fixed decimals
 */
const roundAmount = (amount, decimals = 2) =>
    Number((Math.round(amount * 10 ** decimals) / 10 ** decimals).toFixed(decimals));

/**
 * Get FX rates
 * Hierarchy: ONLINE → OFFLINE → DEFAULT → LEGACY
 */
export const getFxRates = async (baseCurrency) => {
    const base = isCurrencyAllowed(baseCurrency)
        ? baseCurrency.toUpperCase()
        : DEFAULT_CURRENCY;

    let apiRates = {};

    try {
        const res = await axios.get(
            `https://api.frankfurter.app/latest?from=${FX_BRIDGE_CURRENCY}`
        );
        apiRates = res.data?.rates || {};
    } catch (err) {
        throw new Error('FX API failed: ' + err.message);
    }

    const allowedCurrencies =
        ACTIVE_CURRENCY_MODE === CURRENCY_MODE.STRICT
            ? SUPPORTED_CURRENCIES
            : [
                ...new Set([
                    ...Object.keys(apiRates),
                    ...SUPPORTED_CURRENCIES,
                    ...Object.keys(legacyCurrencies),
                ]),
            ];

    const fxList = allowedCurrencies.map((code) => {
        const meta = getCurrencyMeta(code);

        let rate = code === base ? 1 : null;
        let status = code === base ? 'online' : null;
        let fallbackUsed = false;

        if (code !== base) {
            if (apiRates[code]) {
                rate = normalizeRateToBase(code, base);
                status = 'online';
            } else if (currencies[code]?.offlineRate) {
                rate = normalizeRateToBase(code, base);
                status = 'offline';
                fallbackUsed = true;
            } else if (currencies[code]?.defaultRate) {
                rate = normalizeRateToBase(code, base);
                status = 'defaulted';
                fallbackUsed = true;
            } else if (legacyCurrencies[code]) {
                rate = normalizeRateToBase(code, base);
                status = 'legacy';
                fallbackUsed = true;
            } else {
                throw new Error(`No FX rate available for currency: ${code}`);
            }
        }

        return {
            value: code,
            label: meta.label,
            symbol: meta.symbol,
            color: meta.color,
            rate: roundAmount(rate),
            status,
            fallbackUsed,
        };
    });

    return { base, fxList };
};

/**
 * Convert amount safely between currencies
 */
export const convertAmount = async (amount, from, to) => {
    if (!amount || amount <= 0) {
        throw new Error('Invalid amount');
    }

    const fromMeta = getCurrencyMeta(from.toUpperCase());
    const toMeta = getCurrencyMeta(to.toUpperCase());

    const converted =
        (amount / fromMeta.usdRate) * toMeta.usdRate;

    if (!Number.isFinite(converted)) {
        throw new Error('FX conversion overflow');
    }

    return roundAmount(converted, 2);
};
