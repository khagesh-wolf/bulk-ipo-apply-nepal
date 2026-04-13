/**
 * Unit Tests — Database Schema
 *
 * Tests that schema SQL statements are well-formed.
 */

import {
  CURRENT_SCHEMA_VERSION,
  CREATE_ACCOUNTS_TABLE,
  CREATE_APPLICATIONS_TABLE,
  CREATE_PORTFOLIO_TABLE,
  CREATE_CACHED_TOKENS_TABLE,
  CREATE_SCHEMA_VERSION_TABLE,
  CREATE_INDICES,
  ALL_CREATE_STATEMENTS,
} from '@/src/db/schema';

describe('Database Schema', () => {
  it('should have schema version ≥ 1', () => {
    expect(CURRENT_SCHEMA_VERSION).toBeGreaterThanOrEqual(1);
  });

  it('should define accounts table with required columns', () => {
    expect(CREATE_ACCOUNTS_TABLE).toContain('CREATE TABLE');
    expect(CREATE_ACCOUNTS_TABLE).toContain('accounts');
    expect(CREATE_ACCOUNTS_TABLE).toContain('id');
    expect(CREATE_ACCOUNTS_TABLE).toContain('encrypted_password');
    expect(CREATE_ACCOUNTS_TABLE).toContain('encrypted_crn');
    expect(CREATE_ACCOUNTS_TABLE).toContain('encrypted_pin');
    expect(CREATE_ACCOUNTS_TABLE).toContain('dp_id');
    expect(CREATE_ACCOUNTS_TABLE).toContain('username');
    expect(CREATE_ACCOUNTS_TABLE).toContain('is_active');
  });

  it('should define applications table with foreign key', () => {
    expect(CREATE_APPLICATIONS_TABLE).toContain('CREATE TABLE');
    expect(CREATE_APPLICATIONS_TABLE).toContain('applications');
    expect(CREATE_APPLICATIONS_TABLE).toContain('account_id');
    expect(CREATE_APPLICATIONS_TABLE).toContain('FOREIGN KEY');
    expect(CREATE_APPLICATIONS_TABLE).toContain('ON DELETE CASCADE');
  });

  it('should define portfolio table', () => {
    expect(CREATE_PORTFOLIO_TABLE).toContain('CREATE TABLE');
    expect(CREATE_PORTFOLIO_TABLE).toContain('portfolio');
    expect(CREATE_PORTFOLIO_TABLE).toContain('symbol');
    expect(CREATE_PORTFOLIO_TABLE).toContain('current_balance');
  });

  it('should define cached_tokens table with expiration', () => {
    expect(CREATE_CACHED_TOKENS_TABLE).toContain('CREATE TABLE');
    expect(CREATE_CACHED_TOKENS_TABLE).toContain('cached_tokens');
    expect(CREATE_CACHED_TOKENS_TABLE).toContain('expires_at');
    expect(CREATE_CACHED_TOKENS_TABLE).toContain('token');
  });

  it('should define schema_version table', () => {
    expect(CREATE_SCHEMA_VERSION_TABLE).toContain('schema_version');
  });

  it('should have indices for performance', () => {
    expect(CREATE_INDICES.length).toBeGreaterThan(0);
    expect(CREATE_INDICES.some((i) => i.includes('idx_applications_account_id'))).toBe(true);
    expect(CREATE_INDICES.some((i) => i.includes('idx_applications_status'))).toBe(true);
    expect(CREATE_INDICES.some((i) => i.includes('idx_portfolio_account_id'))).toBe(true);
  });

  it('should aggregate all statements in ALL_CREATE_STATEMENTS', () => {
    expect(ALL_CREATE_STATEMENTS.length).toBeGreaterThanOrEqual(5);
    // Should include tables + indices
    const createTableCount = ALL_CREATE_STATEMENTS.filter((s) =>
      s.includes('CREATE TABLE'),
    ).length;
    const createIndexCount = ALL_CREATE_STATEMENTS.filter((s) =>
      s.includes('CREATE INDEX'),
    ).length;

    expect(createTableCount).toBe(5); // 5 tables
    expect(createIndexCount).toBeGreaterThanOrEqual(3); // at least 3 indices
  });
});
