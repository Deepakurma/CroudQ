/**
 * Formats a number or string value into Indian Currency format (e.g. ₹ 1,23,456)
 * @param amount - The amount to format
 * @param showSymbol - Whether to show the currency symbol (default: true)
 * @returns Formatted currency string
 */
export const formatIndianCurrency = (amount: number | string, showSymbol: boolean = true): string => {
    const numericValue = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numericValue)) return showSymbol ? '₹ 0' : '0';

    // Use Intl.NumberFormat for Indian Locale
    const formatter = new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 0, // usually we don't show paisa in overview lists, can adjust if needed
        style: 'decimal',
    });

    const formattedNumber = formatter.format(numericValue);

    return showSymbol ? `₹ ${formattedNumber}` : formattedNumber;
};
