import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import axios from 'axios';
import { getFxRates } from '../../../services/fxService.js';
import { currencies } from '../../../config/currencies.js';

// Mock axios (Jest style)
jest.mock('axios');

describe('FX Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 1 for the base currency', async () => {
        axios.get.mockResolvedValue({
            data: {
                rates: { EUR: 0.9 },
            },
        });

        const result = await getFxRates('USD');
        const usd = result.fxList.find(fx => fx.value === 'USD');

        expect(usd.rate).toBe(1);
        expect(usd.offline).toBe(true); // base currency has no API rate
    });

    it('uses API rates when available', async () => {
        axios.get.mockResolvedValue({
            data: {
                rates: { EUR: 0.85, GBP: 0.75 },
            },
        });

        const result = await getFxRates('USD');

        const eur = result.fxList.find(fx => fx.value === 'EUR');
        const gbp = result.fxList.find(fx => fx.value === 'GBP');

        expect(eur.rate).toBe(0.85);
        expect(eur.offline).toBe(false);

        expect(gbp.rate).toBe(0.75);
        expect(gbp.offline).toBe(false);

        expect(result.fallbackUsed).toBe(false);
    });

    it('falls back to offline rates when API fails', async () => {
        axios.get.mockRejectedValue(new Error('Network error'));

        const result = await getFxRates('USD');

        expect(result.fallbackUsed).toBe(true);

        result.fxList.forEach(fx => {
            if (fx.value !== 'USD') {
                const offlineRate = currencies[fx.value]?.offlineRate ?? null;
                expect(fx.rate).toBe(offlineRate);
                expect(fx.offline).toBe(true);
            }
        });
    });

    it('returns null rate when neither API nor offline rate exists', async () => {
        axios.get.mockResolvedValue({
            data: {
                rates: {}, // empty API response
            },
        });

        const result = await getFxRates('USD');

        const unknown = result.fxList.find(
            fx => fx.value !== 'USD' && !currencies[fx.value].offlineRate
        );

        if (unknown) {
            expect(unknown.rate).toBeNull();
            expect(unknown.offline).toBe(true);
        }
    });
});
