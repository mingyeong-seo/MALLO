export function formatRecoveryDate(
  procedureDate: string,
  elapsedDay: number,
) {
  const match = procedureDate.match(/^(\d{4})[-.](\d{2})[-.](\d{2})$/);

  if (!match) {
    return procedureDate;
  }

  const [, year, month, day] = match;
  const recoveryDate = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  );
  recoveryDate.setUTCDate(
    recoveryDate.getUTCDate() + Math.max(Math.trunc(elapsedDay), 0),
  );

  return [
    recoveryDate.getUTCFullYear(),
    String(recoveryDate.getUTCMonth() + 1).padStart(2, '0'),
    String(recoveryDate.getUTCDate()).padStart(2, '0'),
  ].join('.');
}
