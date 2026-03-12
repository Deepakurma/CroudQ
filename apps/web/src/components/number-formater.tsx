export function formatNumber(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '0';
  // Check for Crores (1 Crore = 10,000,000)
  if (value >= 10000000) {
    return (value / 10000000).toFixed(1).replace(/\.0$/, '') + 'Cr';
  }
  // Check for Lakhs (1 Lakh = 100,000)
  if (value >= 100000) {
    return (value / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
  }
  // Check for Thousands
  if (value >= 1000) {
    return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return value.toString();
}
