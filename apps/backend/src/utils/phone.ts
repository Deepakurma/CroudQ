export const normalizeIndianPhone = (value: string): string => {
    const digits = value.replace(/\D/g, "");

    if (digits.length === 10) {
        return digits;
    }

    if (digits.length === 12 && digits.startsWith("91")) {
        return digits.slice(2);
    }

    return digits;
};

export const isValidIndianPhone = (value: string): boolean => {
    return /^[0-9]{10}$/.test(value);
};
