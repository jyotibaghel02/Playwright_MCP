import { Locator, Page } from '@playwright/test';

export class EmployeePage {
  readonly page: Page;
  readonly pimLink: Locator;
  readonly addEmployeeButton: Locator;
  readonly employeeListLink: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly employeeIdInput: Locator;
  readonly saveButton: Locator;
  readonly employeeNameInput: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pimLink = page.getByRole('link', { name: 'PIM', exact: true });
    this.addEmployeeButton = page.getByRole('button', { name: /Add/ });
    this.employeeListLink = page.getByRole('link', { name: 'Employee List' });
    this.firstNameInput = page.getByPlaceholder('First Name');
    this.lastNameInput = page.getByPlaceholder('Last Name');
    this.employeeIdInput = page.locator('.oxd-input-group')
      .filter({ hasText: 'Employee Id' })
      .getByRole('textbox');
    this.saveButton = page.getByRole('button', { name: 'Save', exact: true });
    this.employeeNameInput = page.locator('.oxd-input-group')
      .filter({ hasText: 'Employee Name' })
      .getByPlaceholder('Type for hints...');
    this.searchButton = page.getByRole('button', { name: 'Search', exact: true });
  }

  async openAddEmployeeForm(): Promise<void> {
    await this.pimLink.click();
    await this.addEmployeeButton.click();
  }

  async addEmployee(firstName: string, lastName: string): Promise<void> {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
  }

  async getEmployeeId(): Promise<string> {
    return this.employeeIdInput.inputValue();
  }

  async saveEmployee(): Promise<void> {
    const profileDetailsLoaded = this.page.waitForResponse(response =>
      response.request().method() === 'GET' &&
      /\/api\/v2\/pim\/employees\/\d+\/personal-details$/.test(response.url()) &&
      response.ok()
    );

    await Promise.all([this.saveButton.click(), profileDetailsLoaded]);
  }

  async searchEmployee(employeeName: string): Promise<void> {
    await this.employeeListLink.click();
    await this.employeeNameInput.fill(employeeName);
    await this.searchButton.click();
  }
}