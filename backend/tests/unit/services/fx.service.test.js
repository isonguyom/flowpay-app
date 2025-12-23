import axios from 'axios';

import {
    legacyCurrencies,
    SUPPORTED_CURRENCIES,
    normalizeRateToBase,
} from '../../../config/currenciesConfig.js';

import { getFxRates, convertAmount } from '../../../services/fxService.js';

jest.mock('axios');

describe('FX Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getFxRates', () => {
        it('returns 1 for base currency with online status', async () => {
            axios.get.mockResolvedValue({ data: { rates: {} } });

            const result = await getFxRates('USD');
            const usd = result.fxList.find(c => c.value === 'USD');

            expect(usd.rate).toBe(1);
            expect(usd.status).toBe('online');
            expect(usd.fallbackUsed).toBe(false);
        });

        it('throws error when API fails', async () => {
            axios.get.mockRejectedValue(new Error('API down'));

            await expect(getFxRates('USD'))
                .rejects
                .toThrow('FX API failed: API down');
        });

        it('uses API rates when API succeeds', async () => {
            axios.get.mockResolvedValue({
                data: { rates: { EUR: 0.92, GBP: 0.79 } },
            });

            const result = await getFxRates('USD');

            const eur = result.fxList.find(c => c.value === 'EUR');
            const gbp = result.fxList.find(c => c.value === 'GBP');

            expect(eur.rate).toBeCloseTo(normalizeRateToBase('EUR', 'USD'), 2);
            expect(eur.status).toBe('online');

            expect(gbp.rate).toBeCloseTo(normalizeRateToBase('GBP', 'USD'), 2);
            expect(gbp.status).toBe('online');
        });

        it.skip('includes offline/defaulted currencies when not in API', async () => {
            axios.get.mockResolvedValue({ data: { rates: {} } });

            const result = await getFxRates('USD');
            const ngn = result.fxList.find(c => c.value === 'NGN');

            expect(ngn.rate).toBeCloseTo(normalizeRateToBase('NGN', 'USD'), 2);
            expect(['offline', 'defaulted']).toContain(ngn.status);
            expect(ngn.fallbackUsed).toBe(true);
        });

        it('handles legacy currencies when present in allowed set', async () => {
            axios.get.mockResolvedValue({ data: { rates: {} } });

            const result = await getFxRates('USD');

            Object.keys(legacyCurrencies).forEach(code => {
                const cur = result.fxList.find(c => c.value === code);
                if (cur) {
                    expect(cur.status).toBe('legacy');
                    expect(cur.fallbackUsed).toBe(true);
                }
            });
        });

        it('filters currencies based on supported list', async () => {
            axios.get.mockResolvedValue({
                data: { rates: { EUR: 0.92, GBP: 0.79, JPY: 148 } },
            });

            const result = await getFxRates('USD');

            result.fxList.forEach(c => {
                expect(
                    SUPPORTED_CURRENCIES.includes(c.value) ||
                    legacyCurrencies[c.value]
                ).toBe(true);
            });
        });
    });

    describe('convertAmount', () => {
        it('converts normal currencies', async () => {
            const converted = await convertAmount(100, 'USD', 'EUR');
            expect(converted).toBeGreaterThan(0);
        });

        it('converts using legacy currencies', async () => {
            const converted = await convertAmount(100, 'ABC', 'XYZ');
            expect(converted).toBeGreaterThan(0);
        });

        it('throws error on unsupported currencies', async () => {
            await expect(convertAmount(100, 'USD', 'NOP'))
                .rejects
                .toThrow('Unsupported currency');
        });

        it('throws error on invalid amounts', async () => {
            await expect(convertAmount(-10, 'USD', 'EUR'))
                .rejects
                .toThrow('Invalid amount');

            await expect(convertAmount(0, 'USD', 'EUR'))
                .rejects
                .toThrow('Invalid amount');
        });
    });
});
