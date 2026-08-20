export function formatElapsedDay(elapsedDay: number) {
  return `DAY ${Math.max(elapsedDay, 0) + 1}`;
}

export function getElapsedDayDescription(elapsedDay: number) {
  return elapsedDay <= 0 ? '시술 당일' : `시술 후 ${elapsedDay}일차`;
}
