// The new tax band under the Nigeria Tax Act: effective from Jan 1, 2026
const tax_bands = [
  { limit: 800000, rate: 0.0 }, //First 800k @ 0% (Tax-free)
  { limit: 2200000, rate: 0.15 }, //Next 2.2m @ 15%
  { limit: 9000000, rate: 0.18 }, //Next 9m @ 18%
  { limit: 13000000, rate: 0.21 }, //Next 13m @ 21%
  { limit: 25000000, rate: 0.23 }, //Next 25m @ 23%
  { limit: Infinity, rate: 0.25 }, //Above 50m @ 25%
];

export const calculateTax = ({ grossSalary, statutoryDeductions = 0, annualRent = 0 }) => {
  // Replacing CRA with the new Rent Relief Allowance
  // Rule: 20% of actual annual rent paid, legally capped at ₦500,000 maximum per year
  const rules = {
    RRA: "Rent Relief Allowance",
    rate: 0.20
  };

  const calculatedRRA = annualRent * rules.rate;
  const appliedRRA = Math.min(calculatedRRA, 500000); // 500k max per year

  // Tax income Calculation
  const taxableIncome = Math.max(0, grossSalary - statutoryDeductions - appliedRRA);

  let remainingIncome = taxableIncome;

  let calculatedTax = 0;
  const breakdown = [];

  // Applying the progressive band loop
  for (const band of tax_bands) {
    if (remainingIncome <= 0) break;

    const taxableAmount = Math.min(remainingIncome, band.limit);
    const taxGenerated = taxableAmount * band.rate;

    calculatedTax += taxGenerated;
   
    breakdown.push({
      rate: `${band.rate * 100}%`,
      taxableAmount,
      taxGenerated
    });

    remainingIncome -= taxableAmount;
  }

  return {
    annual: {
      salary: grossSalary,
      deduction: statutoryDeductions,
      rentRelief: appliedRRA,
      taxableIncome,
      taxBill: calculatedTax,
      netSalary: grossSalary - calculatedTax - statutoryDeductions,
    },
    monthly: {
      salary: grossSalary / 12,
      deduction: statutoryDeductions / 12,
      rentRelief: appliedRRA / 12,
      taxableIncome: taxableIncome / 12,  
      taxBill: calculatedTax / 12,
      netSalary: (grossSalary - calculatedTax - statutoryDeductions) / 12,
    },
    taxBreakdown: breakdown
  };
};
