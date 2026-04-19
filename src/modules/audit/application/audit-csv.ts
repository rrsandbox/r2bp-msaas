const FORMULA_PREFIX = /^[=+\-@\t\r]/;

function normalizeCsvText(value: unknown) {
  if (value === null || value === undefined) return "";

  const text = typeof value === "string" ? value : JSON.stringify(value);

  if (FORMULA_PREFIX.test(text)) {
    return `'${text}`;
  }

  return text;
}

export function formatCsvCell(value: unknown) {
  const text = normalizeCsvText(value);
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function toCsv(rows: Array<Record<string, unknown>>, headers: string[]) {
  const headerLine = headers.join(",");
  const dataLines = rows.map((row) => headers.map((header) => formatCsvCell(row[header])).join(","));
  return [headerLine, ...dataLines].join("\n");
}
