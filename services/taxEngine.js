// =========================================
// NIGERIA TAX ACT 2026
// =========================================

const TAX_BANDS = [
  { limit: 800000, rate: 0.00 },
  { limit: 2200000, rate: 0.15 },
  { limit: 9000000, rate: 0.18 },
  { limit: 13000000, rate: 0.21 },
  { limit: 25000000, rate: 0.23 },
  { limit: Infinity, rate: 0.25 }
];

export function calculateTax({
  grossMonthlyIncome,
  annualRent = 0,
  nhfMonthly = 0,
  nhisMonthly = 0,
  lifeInsuranceMonthly = 0,
  mortgageInterestMonthly = 0
}) {
  // =====================================
  // ANNUAL INCOME
  // =====================================

  const annualIncome = grossMonthlyIncome * 12;

  // =====================================
  // AUTO PENSION (8%)
  // =====================================

  const monthlyPension = grossMonthlyIncome * 0.08;
  const annualPension = monthlyPension * 12;

  // =====================================
  // OTHER DEDUCTIONS
  // =====================================

  const annualNHF = nhfMonthly * 12;
  const annualNHIS = nhisMonthly * 12;
  const annualLifeInsurance =
    lifeInsuranceMonthly * 12;

  const annualMortgageInterest =
    mortgageInterestMonthly * 12;

  // =====================================
  // RENT RELIEF ALLOWANCE
  // 20% OF RENT
  // MAX ₦500,000
  // =====================================

  const annualRentRelief = Math.min(
    annualRent * 0.20,
    500000
  );

  // =====================================
  // TOTAL DEDUCTIONS
  // =====================================

  const annualDeductions =
    annualPension +
    annualNHF +
    annualNHIS +
    annualLifeInsurance +
    annualMortgageInterest;

  // =====================================
  // TAXABLE INCOME
  // =====================================

  const taxableIncome = Math.max(
    0,
    annualIncome -
      annualDeductions -
      annualRentRelief
  );

  // =====================================
  // PAYE CALCULATION
  // =====================================

  let remainingIncome = taxableIncome;
  let annualPAYE = 0;

  const taxBreakdown = [];

  for (const band of TAX_BANDS) {
    if (remainingIncome <= 0) break;

    const taxableAmount = Math.min(
      remainingIncome,
      band.limit
    );

    const taxGenerated =
      taxableAmount * band.rate;

    annualPAYE += taxGenerated;

    taxBreakdown.push({
      rate: `${band.rate * 100}%`,
      taxableAmount,
      taxGenerated
    });

    remainingIncome -= taxableAmount;
  }

  // =====================================
  // NET INCOME
  // =====================================

  const annualNetIncome =
    annualIncome -
    annualDeductions -
    annualPAYE;

  const monthlyNetIncome =
    annualNetIncome / 12;

  // =====================================
  // RETURN DATA
  // =====================================

  return {
  annual: {
    grossIncome: annualIncome,
    pension: annualPension,
    nhf: annualNHF,
    nhis: annualNHIS,
    lifeInsurance: annualLifeInsurance,
    mortgageInterest: annualMortgageInterest,
    rentRelief: annualRentRelief,
    deductions: annualDeductions,
    taxableIncome,
    paye: annualPAYE,
    netIncome: annualNetIncome,
  },

  monthly: {
    grossIncome: grossMonthlyIncome,
    pension: monthlyPension,
    nhf: nhfMonthly,
    nhis: nhisMonthly,
    lifeInsurance: lifeInsuranceMonthly,
    mortgageInterest: mortgageInterestMonthly,
    rentRelief: annualRentRelief / 12,
    deductions: annualDeductions / 12,
    taxableIncome: taxableIncome / 12,
    paye: annualPAYE / 12,
    netIncome: monthlyNetIncome,
  },

  taxBreakdown,
};
}