/**
 * SQLite Database Schema — Bulk IPO Apply Nepal
 *
 * Defines the schema for all tables in the SQLite database:
 * - accounts: MeroShare DP accounts with encrypted credentials
 * - applications: IPO application records
 * - portfolio: Cached portfolio holdings
 * - cached_tokens: JWT tokens with expiration
 */

// ---------------------------------------------------------------------------
// Schema version — increment on every migration
// ---------------------------------------------------------------------------

export const CURRENT_SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// SQL Statements
// ---------------------------------------------------------------------------

export const CREATE_ACCOUNTS_TABLE = `
  CREATE TABLE IF NOT EXISTS accounts (
    id               TEXT PRIMARY KEY NOT NULL,
    nickname         TEXT NOT NULL,
    dp_id            TEXT NOT NULL,
    username         TEXT NOT NULL,
    encrypted_password TEXT NOT NULL,
    encrypted_crn    TEXT NOT NULL,
    encrypted_pin    TEXT NOT NULL,
    bank_id          TEXT NOT NULL DEFAULT '',
    bank_name        TEXT NOT NULL DEFAULT '',
    branch_id        TEXT,
    account_number   TEXT,
    demat            TEXT,
    is_active        INTEGER NOT NULL DEFAULT 1,
    created_at       TEXT NOT NULL,
    last_used        TEXT
  );
`;

export const CREATE_APPLICATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS applications (
    id                 TEXT PRIMARY KEY NOT NULL,
    account_id         TEXT NOT NULL,
    account_nickname   TEXT NOT NULL,
    issue_id           TEXT NOT NULL,
    company_name       TEXT NOT NULL,
    symbol             TEXT NOT NULL DEFAULT '',
    applied_units      INTEGER NOT NULL,
    applied_date       TEXT NOT NULL,
    status             TEXT NOT NULL DEFAULT 'PENDING',
    error_message      TEXT,
    allotted_units     INTEGER,
    applicant_form_id  TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
  );
`;

export const CREATE_PORTFOLIO_TABLE = `
  CREATE TABLE IF NOT EXISTS portfolio (
    id                          TEXT PRIMARY KEY NOT NULL,
    account_id                  TEXT NOT NULL,
    symbol                      TEXT NOT NULL,
    company_name                TEXT NOT NULL,
    current_balance             REAL NOT NULL DEFAULT 0,
    previous_closing_price      REAL NOT NULL DEFAULT 0,
    last_transaction_price      REAL NOT NULL DEFAULT 0,
    value_of_last_trans_price   REAL NOT NULL DEFAULT 0,
    value_of_prev_closing_price REAL NOT NULL DEFAULT 0,
    last_updated                TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
  );
`;

export const CREATE_CACHED_TOKENS_TABLE = `
  CREATE TABLE IF NOT EXISTS cached_tokens (
    account_id   TEXT PRIMARY KEY NOT NULL,
    token        TEXT NOT NULL,
    customer_id  TEXT NOT NULL DEFAULT '',
    expires_at   TEXT NOT NULL,
    created_at   TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
  );
`;

export const CREATE_SCHEMA_VERSION_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY NOT NULL
  );
`;

// ---------------------------------------------------------------------------
// Indices
// ---------------------------------------------------------------------------

export const CREATE_INDICES = [
  `CREATE INDEX IF NOT EXISTS idx_applications_account_id ON applications(account_id);`,
  `CREATE INDEX IF NOT EXISTS idx_applications_issue_id ON applications(issue_id);`,
  `CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);`,
  `CREATE INDEX IF NOT EXISTS idx_portfolio_account_id ON portfolio(account_id);`,
  `CREATE INDEX IF NOT EXISTS idx_cached_tokens_expires ON cached_tokens(expires_at);`,
];

// ---------------------------------------------------------------------------
// All table creation statements in order
// ---------------------------------------------------------------------------

export const ALL_CREATE_STATEMENTS = [
  CREATE_SCHEMA_VERSION_TABLE,
  CREATE_ACCOUNTS_TABLE,
  CREATE_APPLICATIONS_TABLE,
  CREATE_PORTFOLIO_TABLE,
  CREATE_CACHED_TOKENS_TABLE,
  ...CREATE_INDICES,
];
