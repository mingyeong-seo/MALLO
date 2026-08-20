const DEMO_ELAPSED_DAYS = 2;

export function getDemoProcedureDate(now: Date): string {
  const procedureDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - DEMO_ELAPSED_DAYS,
  );

  const year = procedureDate.getFullYear();
  const month = String(procedureDate.getMonth() + 1).padStart(2, '0');
  const day = String(procedureDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
