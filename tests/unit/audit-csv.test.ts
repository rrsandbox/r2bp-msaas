import { formatCsvCell, toCsv } from "@/modules/audit/application/audit-csv";

describe("audit csv", () => {
  it("neutralizes spreadsheet formula injection", () => {
    expect(formatCsvCell("=SUM(A1:A2)")).toBe('"\'=SUM(A1:A2)"');
    expect(formatCsvCell("+cmd")).toBe('"\'+cmd"');
    expect(formatCsvCell("-cmd")).toBe('"\'-cmd"');
    expect(formatCsvCell("@cmd")).toBe('"\'@cmd"');
  });

  it("escapes double quotes", () => {
    expect(formatCsvCell('Joao "Admin"')).toBe('"Joao ""Admin"""');
  });

  it("builds csv with headers and rows", () => {
    const csv = toCsv(
      [
        { action: "ACCESS_DENIED", severity: "WARNING" },
        { action: "LOGIN", severity: "INFO" },
      ],
      ["action", "severity"],
    );

    expect(csv).toContain("action,severity");
    expect(csv).toContain('"ACCESS_DENIED","WARNING"');
    expect(csv).toContain('"LOGIN","INFO"');
  });
});
