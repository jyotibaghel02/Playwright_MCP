import { test, expect } from '@playwright/test';
import ExcelJS from 'exceljs';
import { EmployeePage } from '../pages/EmployeePage';
import { LoginPage } from '../pages/LoginPage';

test('login results match every row in the Excel test data', async ({ browser }) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('test-data/excelData.xlsx');

  const worksheet = workbook.worksheets[0];
  expect(worksheet, 'The workbook must contain a worksheet').toBeDefined();

  const columns = new Map<string, number>();
  worksheet.getRow(1).eachCell((cell, columnNumber) => {
    columns.set(cell.text.trim(), columnNumber);
  });

  for (const header of ['Username', 'Password', 'Expected']) {
    expect(columns.has(header), `Missing required Excel column: ${header}`).toBe(true);
  }

  const rows: { rowNumber: number; username: string; password: string; expected: string }[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const expected = row.getCell(columns.get('Expected')!).text.trim();
    if (expected) {
      rows.push({
        rowNumber,
        username: row.getCell(columns.get('Username')!).text.trim(),
        password: row.getCell(columns.get('Password')!).text.trim(),
        expected,
      });
    }
  });

  expect(rows.length, 'The workbook must contain at least one test data row').toBeGreaterThan(0);
  test.setTimeout(Math.max(30_000, rows.length * 15_000));

  const failures: string[] = [];
  for (const row of rows) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(row.username, row.password);

      if (row.expected === 'Dashboard') {
        await expect(loginPage.dashboardHeading).toBeVisible();
      } else if (row.expected === 'Invalid credentials') {
        await expect(loginPage.invalidCredentialsMessage).toBeVisible();
      } else {
        throw new Error(`Unsupported expected result "${row.expected}"`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`Excel row ${row.rowNumber}: ${message}`);
    } finally {
      await context.close();
    }
  }

  expect(failures, failures.join('\n')).toEqual([]);
});

test('user can add an employee and find them in the Employee List', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const employeePage = new EmployeePage(page);

  await loginPage.goto();
  await loginPage.login('Admin', 'admin123');

  await expect(loginPage.dashboardHeading).toBeVisible();

  await employeePage.openAddEmployeeForm();
  await employeePage.addEmployee('Test', '124');

  await expect(employeePage.employeeIdInput).toBeVisible();
  const employeeId = await employeePage.getEmployeeId();

  await employeePage.saveEmployee();
  await expect(page.getByRole('heading', { name: 'Test 124' })).toBeVisible();

  await employeePage.searchEmployee('Test 124');
  const employeeRow = page.getByRole('row')
    .filter({ hasText: employeeId })
    .filter({ hasText: 'Test 124' });
  await expect(employeeRow).toContainText('Test 124');
});