/**
 * Unit Tests — Broker Directory (Phase 5)
 *
 * Tests broker search, lookup, and TMS URL functions.
 */

import {
  BROKERS,
  searchBrokers,
  getBrokerById,
  getBrokerByCode,
  getTMSUrl,
  getBrokerLocations,
} from '@/lib/brokerDirectory';

describe('Broker Directory', () => {
  describe('BROKERS data', () => {
    it('should have at least 15 brokers', () => {
      expect(BROKERS.length).toBeGreaterThanOrEqual(15);
    });

    it('should have valid broker data', () => {
      for (const broker of BROKERS) {
        expect(broker.id).toBeGreaterThan(0);
        expect(broker.name.length).toBeGreaterThan(0);
        expect(broker.code.length).toBeGreaterThan(0);
        expect(broker.tmsUrl).toMatch(/^https:\/\/tms\d+\.nepsetms\.com\.np$/);
        expect(broker.commissionRate).toBeGreaterThan(0);
        expect(broker.commissionRate).toBeLessThan(1);
      }
    });

    it('should have unique IDs', () => {
      const ids = BROKERS.map((b) => b.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('searchBrokers', () => {
    it('should return all brokers for empty query', () => {
      const result = searchBrokers('');
      expect(result).toHaveLength(BROKERS.length);
    });

    it('should search by name', () => {
      const result = searchBrokers('Sunrise');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toContain('Sunrise');
    });

    it('should search case-insensitively', () => {
      const result = searchBrokers('nabil');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should search by location', () => {
      const result = searchBrokers('Kamaladi');
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((b) => b.address.includes('Kamaladi'))).toBe(true);
    });

    it('should return empty for non-matching query', () => {
      const result = searchBrokers('XYZNonExistent123');
      expect(result).toHaveLength(0);
    });
  });

  describe('getBrokerById', () => {
    it('should find broker by ID', () => {
      const broker = getBrokerById(1);
      expect(broker).toBeDefined();
      expect(broker!.name).toContain('Sunrise');
    });

    it('should return undefined for non-existent ID', () => {
      const broker = getBrokerById(99999);
      expect(broker).toBeUndefined();
    });
  });

  describe('getBrokerByCode', () => {
    it('should find broker by code', () => {
      const broker = getBrokerByCode('8');
      expect(broker).toBeDefined();
      expect(broker!.name).toContain('Global IME');
    });

    it('should return undefined for non-existent code', () => {
      const broker = getBrokerByCode('99999');
      expect(broker).toBeUndefined();
    });
  });

  describe('getTMSUrl', () => {
    it('should return TMS URL for valid broker', () => {
      const url = getTMSUrl(1);
      expect(url).toBe('https://tms01.nepsetms.com.np');
    });

    it('should return undefined for invalid broker', () => {
      const url = getTMSUrl(99999);
      expect(url).toBeUndefined();
    });
  });

  describe('getBrokerLocations', () => {
    it('should return unique locations', () => {
      const locations = getBrokerLocations();
      expect(locations.length).toBeGreaterThan(0);
      expect(new Set(locations).size).toBe(locations.length);
    });

    it('should include Kathmandu locations', () => {
      const locations = getBrokerLocations();
      expect(locations.some((l) => l.includes('Kathmandu'))).toBe(true);
    });

    it('should be sorted alphabetically', () => {
      const locations = getBrokerLocations();
      for (let i = 1; i < locations.length; i++) {
        expect(locations[i].localeCompare(locations[i - 1])).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
