export const calculateTax = ({ salary, deductions, rules }) => {
  //
  const cra = rules.cra;

  const taxableIncome = Math.max(0, salary - deductions - cra);

  let tax = 0;
  let remaining = taxableIncome;

  for (const band of rules.bands) {
    const amount = Math.min(remaining, band.limit);
    tax += amount * band.rate;
    remaining -= amount;
    if (remaining <= 0) break;
  }

  return {
    grossSalary: salary,
    deductions,
    cra,
    taxableIncome,
    tax,
    netSalary: salary - tax - deductions,
  };
};
