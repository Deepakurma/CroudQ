import {
  addMonths,
  differenceInCalendarMonths,
  format,
  isBefore,
  startOfDay,
} from "date-fns";

const isSameMonthYear = (a: Date, b: Date) =>
  a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

export const calculateRentTrackingStartDate = (
  checkInStr: string,
  advanceMonthsStr: string | number,
  todayInput: Date = new Date(),
) => {
  if (!checkInStr) return "Select Check-In Date";

  const [day, month, year] = checkInStr.split("/").map(Number);
  if (!day || !month || !year) return "Invalid Date";

  const checkInDate = new Date(year, month - 1, day);
  const advance = Number(advanceMonthsStr) || 0;
  const today = startOfDay(todayInput);

  let nextRentDueDate: Date;

  // Always start tracking after at least one full month from check-in.
  const minMonthsFromCheckIn = Math.max(1, advance);
  const minimumAllowedDate = addMonths(checkInDate, minMonthsFromCheckIn);

  if (isBefore(today, minimumAllowedDate)) {
    nextRentDueDate = minimumAllowedDate;
  } else {
    const monthsDiff = differenceInCalendarMonths(today, minimumAllowedDate);
    const tentativeDate = addMonths(minimumAllowedDate, monthsDiff);

    if (isBefore(today, tentativeDate)) {
      nextRentDueDate = tentativeDate;
    } else {
      nextRentDueDate = addMonths(tentativeDate, 1);
    }
  }

  // Product rule: never start rent tracking in the current month.
  if (isSameMonthYear(nextRentDueDate, today)) {
    nextRentDueDate = addMonths(nextRentDueDate, 1);
  }

  return format(nextRentDueDate, "dd/MM/yyyy");
};
