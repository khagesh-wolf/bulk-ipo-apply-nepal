/**
 * Broker Directory — Bulk IPO Apply Nepal
 *
 * Directory of all registered SEBON/NEPSE brokers with contact info,
 * TMS login links, and commission rates.
 */

import type { BrokerInfo } from '@/types';

// ---------------------------------------------------------------------------
// Broker Data (Top NEPSE Brokers)
// ---------------------------------------------------------------------------

export const BROKERS: BrokerInfo[] = [
  { id: 1,  name: 'Sunrise Capital Ltd.',              code: '1',  address: 'Gairidhara, Kathmandu',       phone: '01-4441003',  email: 'info@sunrisecapital.com.np',      tmsUrl: 'https://tms01.nepsetms.com.np',  commissionRate: 0.40 },
  { id: 2,  name: 'Kumari Securities Pvt. Ltd.',       code: '2',  address: 'Dillibazar, Kathmandu',       phone: '01-4444732',  email: 'info@kumarisecurities.com',       tmsUrl: 'https://tms02.nepsetms.com.np',  commissionRate: 0.40 },
  { id: 3,  name: 'Secured Securities Ltd.',           code: '3',  address: 'Putalisadak, Kathmandu',      phone: '01-4221899',  email: 'info@securedsecurities.com.np',   tmsUrl: 'https://tms03.nepsetms.com.np',  commissionRate: 0.40 },
  { id: 4,  name: 'Primo Securities Pvt. Ltd.',        code: '4',  address: 'Dillibazar, Kathmandu',       phone: '01-4419707',  email: 'info@primosecurities.com.np',     tmsUrl: 'https://tms04.nepsetms.com.np',  commissionRate: 0.40 },
  { id: 5,  name: 'Arun Securities Pvt. Ltd.',         code: '5',  address: 'Biratnagar, Morang',          phone: '021-526023',  email: 'info@arunsecurities.com',         tmsUrl: 'https://tms05.nepsetms.com.np',  commissionRate: 0.45 },
  { id: 6,  name: 'Naasa Securities Co. Ltd.',         code: '6',  address: 'Naxal, Kathmandu',            phone: '01-4416116',  email: 'info@naasa.com.np',               tmsUrl: 'https://tms06.nepsetms.com.np',  commissionRate: 0.40 },
  { id: 7,  name: 'Pragyan Securities Ltd.',           code: '7',  address: 'Dillibazar, Kathmandu',       phone: '01-4432480',  email: 'info@pragyansecurities.com.np',   tmsUrl: 'https://tms07.nepsetms.com.np',  commissionRate: 0.45 },
  { id: 8,  name: 'Global IME Capital Ltd.',           code: '8',  address: 'Kamaladi, Kathmandu',         phone: '01-4253385',  email: 'info@globalimecapital.com',       tmsUrl: 'https://tms08.nepsetms.com.np',  commissionRate: 0.40 },
  { id: 9,  name: 'Siddhartha Capital Ltd.',           code: '9',  address: 'Kamaladi, Kathmandu',         phone: '01-4231513',  email: 'info@siddharthacapital.com',      tmsUrl: 'https://tms09.nepsetms.com.np',  commissionRate: 0.40 },
  { id: 10, name: 'Prabhu Capital Ltd.',               code: '10', address: 'Babar Mahal, Kathmandu',      phone: '01-5120711',  email: 'info@prabhucapital.com',          tmsUrl: 'https://tms10.nepsetms.com.np',  commissionRate: 0.40 },
  { id: 11, name: 'Himalayan Securities Ltd.',         code: '11', address: 'Thamel, Kathmandu',           phone: '01-4422822',  email: 'info@himalayansecurities.com',    tmsUrl: 'https://tms11.nepsetms.com.np',  commissionRate: 0.45 },
  { id: 12, name: 'NMB Capital Ltd.',                  code: '12', address: 'Babar Mahal, Kathmandu',      phone: '01-5120022',  email: 'info@nmbcapital.com.np',          tmsUrl: 'https://tms12.nepsetms.com.np',  commissionRate: 0.40 },
  { id: 24, name: 'Siddhartha Securities Pvt. Ltd.',   code: '24', address: 'Putalisadak, Kathmandu',      phone: '01-4168466',  email: 'info@siddharthasecurities.com',   tmsUrl: 'https://tms24.nepsetms.com.np',  commissionRate: 0.45 },
  { id: 50, name: 'Nabil Investment Banking Ltd.',     code: '50', address: 'Beena Marg, Kathmandu',       phone: '01-4002034',  email: 'info@nabilinvest.com.np',         tmsUrl: 'https://tms50.nepsetms.com.np',  commissionRate: 0.40 },
  { id: 51, name: 'Nepal Investment Capital Merchant Banking', code: '51', address: 'Durbarmarg, Kathmandu', phone: '01-4261919', email: 'info@nicmerchant.com.np',       tmsUrl: 'https://tms51.nepsetms.com.np',  commissionRate: 0.45 },
  { id: 52, name: 'Citizens Capital Market Ltd.',      code: '52', address: 'Narayanhiti, Kathmandu',      phone: '01-4169024',  email: 'info@citizenscapital.com.np',     tmsUrl: 'https://tms52.nepsetms.com.np',  commissionRate: 0.45 },
  { id: 53, name: 'Sanima Capital Ltd.',               code: '53', address: 'Nagpokhari, Kathmandu',       phone: '01-4013120',  email: 'info@sanimacapital.com.np',       tmsUrl: 'https://tms53.nepsetms.com.np',  commissionRate: 0.40 },
  { id: 54, name: 'Laxmi Capital Market Ltd.',         code: '54', address: 'Hattisar, Kathmandu',         phone: '01-4444802',  email: 'info@laxmicapital.com',           tmsUrl: 'https://tms54.nepsetms.com.np',  commissionRate: 0.40 },
  { id: 55, name: 'Muktinath Capital Ltd.',            code: '55', address: 'Lazimpat, Kathmandu',         phone: '01-4003400',  email: 'info@muktinathcapital.com.np',    tmsUrl: 'https://tms55.nepsetms.com.np',  commissionRate: 0.45 },
  { id: 56, name: 'Mega Capital Markets Ltd.',         code: '56', address: 'Kamaladi, Kathmandu',         phone: '01-4168820',  email: 'info@megacapitalmarkets.com.np',  tmsUrl: 'https://tms56.nepsetms.com.np',  commissionRate: 0.45 },
];

// ---------------------------------------------------------------------------
// Lookup Functions
// ---------------------------------------------------------------------------

/**
 * Search brokers by name, code, or address.
 */
export function searchBrokers(query: string): BrokerInfo[] {
  if (!query.trim()) return BROKERS;

  const q = query.toLowerCase();
  return BROKERS.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.code.toLowerCase().includes(q) ||
      b.address.toLowerCase().includes(q),
  );
}

/**
 * Get broker by numeric ID.
 */
export function getBrokerById(id: number): BrokerInfo | undefined {
  return BROKERS.find((b) => b.id === id);
}

/**
 * Get broker by code string.
 */
export function getBrokerByCode(code: string): BrokerInfo | undefined {
  return BROKERS.find((b) => b.code === code);
}

/**
 * Get the TMS URL for a specific broker.
 */
export function getTMSUrl(brokerId: number): string | undefined {
  return BROKERS.find((b) => b.id === brokerId)?.tmsUrl;
}

/**
 * Get all unique broker locations.
 */
export function getBrokerLocations(): string[] {
  const locations = new Set(BROKERS.map((b) => b.address));
  return Array.from(locations).sort();
}
