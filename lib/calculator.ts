/**
 * NEPSE Share Profit/Loss Calculator
 *
 * Commission rates as per SEBON directives (effective 2023/24):
 *
 * Broker Commission (buyer & seller):
 *   Transaction amount ≤ NPR 50,000        → 0.60%
 *   NPR 50,001  – NPR 500,000              → 0.55%
 *   NPR 500,001 – NPR 2,000,000            → 0.50%
 *   NPR 2,000,001 – NPR 10,000,000         → 0.45%
 *   > NPR 10,000,000                       → 0.40%
 *
 * SEBON Regulatory Fee:
 *   0.015% of transaction amount (both buy & sell)
 *
 * DP Fee (CDSC): NPR 25 per sell transaction
 *
 * Capital Gains Tax (CGT):
 *   Individual holding < 1 year            → 7.5% of gain
 *   Individual holding ≥ 1 year            → 5.0% of gain
 *   Institutional                          → 10.0% of gain
 *
 * Note: CGT is only applied on profit. No rebate on loss.
 */

import type { CalculatorResult } from '@/types';

// ---------------------------------------------------------------------------
// Commission rate schedule
// ---------------------------------------------------------------------------

function brokerCommissionRate(amount: number): number {
  if (amount <= 50_000) return 0.006;
  if (amount <= 500_000) return 0.0055;
  if (amount <= 2_000_000) return 0.005;
  if (amount <= 10_000_000) return 0.0045;
  return 0.004;
}

const SEBON_RATE = 0.00015; // 0.015%
const DP_FEE_PER_SELL = 25; // NPR

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type CGTType = 'short' | 'long' | 'institutional';

interface CalculatorInput {
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  cgtType?: CGTType; // default: 'short'
}

/**
 * Calculate net profit/loss for a NEPSE share transaction.
 */
export function calculateShareProfitLoss(
  input: CalculatorInput,
): CalculatorResult {
  const { buyPrice, sellPrice, quantity, cgtType = 'short' } = input;

  const investedAmount = buyPrice * quantity;
  const saleAmount = sellPrice * quantity;

  // Broker commission (applied on both buy and sell sides)
  const buyCommission = investedAmount * brokerCommissionRate(investedAmount);
  const sellCommission = saleAmount * brokerCommissionRate(saleAmount);
  const brokerCommission = buyCommission + sellCommission;

  // SEBON regulatory fee (buy + sell)
  const sebon = (investedAmount + saleAmount) * SEBON_RATE;

  // DP fee (charged per sell transaction)
  const dpFee = DP_FEE_PER_SELL;

  // Gross profit before taxes
  const grossProfit = saleAmount - investedAmount - brokerCommission - sebon - dpFee;

  // Capital gains tax (only if profit)
  let cgtRate = 0;
  if (grossProfit > 0) {
    if (cgtType === 'short') cgtRate = 0.075;
    else if (cgtType === 'long') cgtRate = 0.05;
    else cgtRate = 0.10;
  }
  const capitalGainsTax = grossProfit > 0 ? grossProfit * cgtRate : 0;

  // Net profit/loss
  const netProfitLoss = grossProfit - capitalGainsTax;
  const netProfitLossPercent =
    investedAmount > 0 ? (netProfitLoss / investedAmount) * 100 : 0;

  return {
    buyPrice,
    sellPrice,
    quantity,
    investedAmount,
    saleAmount,
    brokerCommission: Number(brokerCommission.toFixed(2)),
    sebon: Number(sebon.toFixed(2)),
    dpFee,
    capitalGainsTax: Number(capitalGainsTax.toFixed(2)),
    netProfitLoss: Number(netProfitLoss.toFixed(2)),
    netProfitLossPercent: Number(netProfitLossPercent.toFixed(4)),
  };
}

/**
 * Calculate the minimum sell price needed to break even (net profit = 0).
 */
export function breakEvenPrice(
  buyPrice: number,
  quantity: number,
  cgtType: CGTType = 'short',
): number {
  // Binary search between buyPrice and buyPrice * 2
  let lo = buyPrice;
  let hi = buyPrice * 3;

  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) / 2;
    const result = calculateShareProfitLoss({
      buyPrice,
      sellPrice: mid,
      quantity,
      cgtType,
    });

    if (result.netProfitLoss < 0) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return Number(((lo + hi) / 2).toFixed(2));
}
