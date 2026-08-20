export function formatRecoveryDay(day: number) {
  return day <= 0 ? '시술 당일' : `DAY ${day}`;
}
