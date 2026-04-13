/**
 * Unit Tests — Models
 *
 * Tests data model mappers and helper functions.
 */

import { buildBoid, accountRowToAccount, type AccountRow } from '@/src/models/Account';
import { applicationRowToApplication, type ApplicationRow } from '@/src/models/IPOApplication';
import { portfolioRowToHolding, type PortfolioRow } from '@/src/models/Portfolio';

describe('Models', () => {
  describe('Account', () => {
    describe('buildBoid', () => {
      it('should build 16-digit BOID from dpId and crn', () => {
        const boid = buildBoid('13060001', '12345678');
        expect(boid).toHaveLength(16);
        expect(boid).toBe('1306000112345678');
      });

      it('should pad short IDs with zeros', () => {
        const boid = buildBoid('1306', '1234');
        expect(boid).toHaveLength(16);
        expect(boid).toBe('0000130600001234');
      });

      it('should strip non-digit characters', () => {
        const boid = buildBoid('130-600-01', 'CRN-1234-5678');
        expect(boid).toHaveLength(16);
      });
    });

    describe('accountRowToAccount', () => {
      it('should map a database row to an Account', () => {
        const row: AccountRow = {
          id: 'acc-1',
          nickname: 'Test Account',
          dp_id: '13060001',
          username: 'testuser',
          encrypted_password: 'enc_pass',
          encrypted_crn: 'enc_crn',
          encrypted_pin: 'enc_pin',
          bank_id: '42',
          bank_name: 'Test Bank',
          branch_id: '1',
          account_number: '9876',
          demat: '1306000112345678',
          is_active: 1,
          created_at: '2024-01-01T00:00:00Z',
          last_used: null,
        };

        const account = accountRowToAccount(row, 'password', 'crn123', '1234');

        expect(account.id).toBe('acc-1');
        expect(account.password).toBe('password');
        expect(account.crn).toBe('crn123');
        expect(account.pin).toBe('1234');
        expect(account.isActive).toBe(true);
        expect(account.lastUsed).toBeNull();
      });

      it('should handle is_active = 0', () => {
        const row: AccountRow = {
          id: 'acc-2',
          nickname: 'Inactive',
          dp_id: '13060002',
          username: 'user2',
          encrypted_password: 'enc',
          encrypted_crn: 'enc',
          encrypted_pin: 'enc',
          bank_id: '42',
          bank_name: 'Bank',
          branch_id: null,
          account_number: null,
          demat: null,
          is_active: 0,
          created_at: '2024-01-01T00:00:00Z',
          last_used: '2024-06-01T00:00:00Z',
        };

        const account = accountRowToAccount(row, 'pass', 'crn', 'pin');
        expect(account.isActive).toBe(false);
        expect(account.branchId).toBeUndefined();
        expect(account.lastUsed).toBe('2024-06-01T00:00:00Z');
      });
    });
  });

  describe('IPOApplication', () => {
    describe('applicationRowToApplication', () => {
      it('should map a database row to an IPOApplication', () => {
        const row: ApplicationRow = {
          id: 'app-1',
          account_id: 'acc-1',
          account_nickname: 'Test Account',
          issue_id: 'ipo-1',
          company_name: 'Test Company Ltd',
          symbol: 'TCL',
          applied_units: 10,
          applied_date: '2024-01-15T10:30:00Z',
          status: 'APPLIED',
          error_message: null,
          allotted_units: null,
          applicant_form_id: 'form-123',
        };

        const app = applicationRowToApplication(row);

        expect(app.id).toBe('app-1');
        expect(app.accountId).toBe('acc-1');
        expect(app.status).toBe('APPLIED');
        expect(app.errorMessage).toBeUndefined();
        expect(app.applicantFormId).toBe('form-123');
      });
    });
  });

  describe('Portfolio', () => {
    describe('portfolioRowToHolding', () => {
      it('should map a database row to a PortfolioHolding', () => {
        const row: PortfolioRow = {
          id: 'port-1',
          account_id: 'acc-1',
          symbol: 'NABIL',
          company_name: 'Nabil Bank Limited',
          current_balance: 100,
          previous_closing_price: 1200,
          last_transaction_price: 1250,
          value_of_last_trans_price: 125000,
          value_of_prev_closing_price: 120000,
          last_updated: '2024-01-15T10:30:00Z',
        };

        const holding = portfolioRowToHolding(row);

        expect(holding.symbol).toBe('NABIL');
        expect(holding.currentBalance).toBe(100);
        expect(holding.accountId).toBe('acc-1');
      });
    });
  });
});
