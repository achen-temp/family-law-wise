// Run with: npm exec --yes --package=@playwright/test -- node scripts/member2-smoke.mjs
// Playwright is an external validation tool; no application dependency is added.
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';
const resolveModule = createRequire(import.meta.url).resolve;
const playwrightModule = resolveModule(process.argv[2] || '@playwright/test', {
  paths: (process.env.PATH || '').split(path.delimiter).map((entry) => path.resolve(entry, '..')),
});
const playwright = await import(pathToFileURL(playwrightModule).href);
const { chromium, expect } = playwright.default ?? playwright;
const base = process.argv[3] || 'http://localhost:3000';
const results = [];
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const image = (name) => ({ name, mimeType: 'image/png', buffer: png });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  async function step(name, run) {
    await run(); results.push(name); console.log(`PASS ${name}`);
  }
  async function noOverflow(label) {
    const overflow = await page.evaluate(() => ({ width: window.innerWidth, content: document.documentElement.scrollWidth }));
    assert.ok(overflow.content <= overflow.width, `${label}: content ${overflow.content}px exceeds ${overflow.width}px`);
  }
  async function capture(name) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `.next/member2-review/${name}.png`, fullPage: true });
  }
  try {
    await page.goto(`${base}/portal/matter-john/checklist`);
    await page.getByRole('link', { name: /Pay stub #3/ }).click();
    await page.waitForURL('**/checklist/req-*');
    const uploadUrl = page.url();
    const itemId = uploadUrl.split('/').pop();
    await step('Invalid and empty files are blocked', async () => {
      await page.getByLabel('Choose a document').setInputFiles({ name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('test') });
      await expect(page.locator('main').getByRole('alert')).toContainText('non-empty PDF');
      await expect(page.getByRole('button', { name: 'Confirm submission' })).toHaveCount(0);
      await page.getByLabel('Choose a document').setInputFiles({ name: 'empty.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(0) });
      await expect(page.locator('main').getByRole('alert')).toBeVisible();
    });
    await step('Selection, preview, replacement and cancellation do not submit', async () => {
      await page.getByLabel('Choose a document').setInputFiles(image('first.png'));
      await expect(page.getByAltText('Preview of first.png')).toBeVisible();
      assert.equal(page.url(), uploadUrl);
      await page.getByLabel('Choose a document').setInputFiles(image('replacement.png'));
      await expect(page.getByAltText('Preview of first.png')).toHaveCount(0);
      await expect(page.getByAltText('Preview of replacement.png')).toBeVisible();
      await page.getByRole('button', { name: 'Cancel selection' }).click();
      await expect(page.getByRole('button', { name: 'Confirm submission' })).toHaveCount(0);
      await expect(page.getByText('Current file:', { exact: false })).toHaveCount(0);
    });
    await step('Sample selection requires confirmation and discloses missing contents', async () => {
      await page.getByRole('button', { name: 'Select sample PDF' }).click();
      await expect(page.getByText(/no PDF contents are available/)).toBeVisible();
      assert.equal(page.url(), uploadUrl);
      await page.getByRole('button', { name: 'Cancel selection' }).click();
    });
    await step('PDF preview uses the selected file bytes and exposes an open link', async () => {
      const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Count 0 /Kids [] >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
      await page.getByLabel('Choose a document').setInputFiles({ name: 'preview.pdf', mimeType: 'application/pdf', buffer: pdf });
      await expect(page.locator('object[type="application/pdf"]')).toBeVisible();
      const link = page.getByRole('link', { name: 'Open local file in a new tab' });
      await expect(link).toHaveAttribute('target', '_blank');
      const url = await link.getAttribute('href');
      const contents = await page.evaluate(async (url) => (await fetch(url)).text(), url);
      assert.equal(contents, pdf.toString());
      await page.getByRole('button', { name: 'Cancel selection' }).click();
    });
    await step('Submit, reopen and preview the actual file in both roles', async () => {
      await page.getByLabel('Choose a document').setInputFiles(image('submitted.png'));
      await page.getByRole('button', { name: 'Confirm submission' }).click();
      const receipt = page.getByRole('status', { name: 'Submission result' });
      await expect(receipt).toContainText('File submitted successfully');
      await expect(receipt).toContainText('submitted.png');
      await expect(receipt).toContainText('Pay stub #3');
      await expect(receipt).toContainText('waiting for your attorney');
      await receipt.getByRole('button', { name: 'Dismiss confirmation' }).click();
      await expect(receipt).toHaveCount(0);
      await page.getByRole('link', { name: /Pay stub #3/ }).click();
      await expect(page.getByText('Current file: submitted.png')).toBeVisible();
      await expect(page.getByAltText('Preview of submitted.png')).toBeVisible();
      await page.getByRole('link', { name: 'View submitted file details and history' }).click();
      await expect(page.getByRole('heading', { name: 'Linked requirements' })).toBeVisible();
      await page.getByRole('link', { name: 'Demo: view as attorney', exact: true }).click();
      await expect(page.getByAltText('Preview of submitted.png')).toBeVisible();
    });
    await step('Reject requires a reason and appears in client requests', async () => {
      await page.getByRole('button', { name: 'Reject', exact: true }).click();
      await page.getByRole('button', { name: 'Confirm rejection' }).click();
      await expect(page.locator('main').getByRole('alert')).toContainText('Enter a reason');
      await page.getByPlaceholder('What should the client send instead?').fill('Please provide all pages.');
      await page.getByRole('button', { name: 'Confirm rejection' }).click();
      await expect(page.getByText('Returned for correction.', { exact: false })).toBeVisible();
      await page.getByRole('link', { name: 'Demo: view file as client' }).click();
      await page.waitForURL('**/portal/matter-john/documents/*');
      await expect(page.getByText('Return reason: Please provide all pages.')).toBeVisible();
      await page.getByRole('link', { name: /^Requests/ }).click();
      await expect(page.getByText('Returned: submitted.png')).toBeVisible();
      await expect(page.getByText('Please provide all pages.', { exact: true })).toBeVisible();
    });
    await step('Corrected submission clears the returned request and keeps history', async () => {
      await page.locator(`a[href="/portal/matter-john/checklist/${itemId}"]`).click();
      await page.getByLabel('Choose a document').setInputFiles(image('corrected.png'));
      await page.getByRole('button', { name: 'Confirm submission' }).click();
      await page.getByRole('link', { name: /^Requests/ }).click();
      await expect(page.getByText('Returned: submitted.png')).toHaveCount(0);
      await page.getByRole('link', { name: 'Submitted files', exact: true }).click();
      await page.getByRole('link', { name: /^corrected.png/ }).click();
      await expect(page.getByRole('link', { name: /^submitted.png/ })).toBeVisible();
      await page.getByRole('link', { name: /^submitted.png/ }).click();
      await expect(page.getByText('Return reason: Please provide all pages.')).toBeVisible();
      await page.getByRole('link', { name: /^corrected.png/ }).click();
      await page.getByRole('link', { name: 'Demo: view as attorney', exact: true }).click();
    });
    await step('Global queue is searchable and updates after acceptance', async () => {
      await page.getByRole('link', { name: 'Global review queue', exact: true }).click();
      await page.getByLabel('Filter by review status').selectOption('ALL');
      await page.getByLabel('Search files, clients, or matters').fill('Sarah');
      await expect(page.locator('main a[href^="/matters/matter-sarah/documents/"]').first()).toBeVisible();
      await page.getByLabel('Filter by review status').selectOption('NEEDS_REVIEW');
      await page.getByLabel('Search files, clients, or matters').fill('corrected.png');
      await expect(page.getByRole('link', { name: /^corrected.png/ })).toBeVisible();
      await page.getByRole('link', { name: /^corrected.png/ }).click();
      await page.getByRole('button', { name: 'Accept', exact: true }).click();
      await page.getByRole('link', { name: 'Global review queue', exact: true }).click();
      await page.getByLabel('Search files, clients, or matters').fill('corrected.png');
      await expect(page.getByText('No files match this view.')).toBeVisible();
      await page.getByLabel('Filter by review status').selectOption('ACCEPTED');
      await page.getByRole('link', { name: /^corrected.png/ }).click();
      await page.getByRole('link', { name: 'Demo: view file as client' }).click();
      await page.waitForURL('**/portal/matter-john/documents/*');
    });
    await step('Unavailable explanation can be submitted, reopened and edited', async () => {
      await page.getByRole('link', { name: /^Checklist/ }).click();
      await page.waitForURL('**/portal/matter-john/checklist');
      await page.getByRole('link', { name: /Latest statement.*Missing/ }).first().click();
      await page.waitForURL('**/checklist/req-*');
      await page.getByRole('button', { name: /get this document/ }).click();
      await page.getByRole('button', { name: 'Submit explanation' }).click();
      await expect(page.getByText('Add a short note so your attorney can review it.')).toBeVisible();
      await page.getByPlaceholder('Add a short note for your attorney').fill('Waiting for the bank to send a copy.');
      const explanationUrl = page.url();
      await page.getByRole('button', { name: 'Submit explanation' }).click();
      await page.locator(`a[href="${new URL(explanationUrl).pathname}"]`).click();
      await expect(page.getByText('Your submitted explanation')).toBeVisible();
      await page.getByRole('button', { name: /get this document/ }).click();
      await expect(page.getByPlaceholder('Add a short note for your attorney')).toHaveValue('Waiting for the bank to send a copy.');
      await page.getByPlaceholder('Add a short note for your attorney').fill('Bank will send it next week.');
      await page.getByRole('button', { name: 'Submit explanation' }).click();
      await page.locator(`a[href="${new URL(explanationUrl).pathname}"]`).click();
      await expect(page.getByText('I do not have access: Bank will send it next week.')).toBeVisible();
    });
    await step('Mobile preview and actions fit the viewport', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByLabel('Choose a document').setInputFiles(image('mobile.png'));
      await page.getByRole('button', { name: 'Confirm submission' }).scrollIntoViewIfNeeded();
      await expect(page.getByRole('button', { name: 'Confirm submission' })).toBeVisible();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      await page.getByRole('button', { name: 'Cancel selection' }).click();
    });
    await step('Explanation history survives a later file submission', async () => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.getByLabel('Choose a document').setInputFiles(image('explanation-followup.png'));
      await page.getByRole('button', { name: 'Confirm submission' }).click();
      await expect(page.getByRole('status', { name: 'Submission result' })).toContainText('Needs review');
      await page.getByRole('link', { name: 'Submitted files', exact: true }).click();
      await expect(page.getByText(/Explanation: Bank will send it next week/)).toBeVisible();
      await page.getByRole('link', { name: /^explanation-followup.png/ }).click();
      await expect(page.getByAltText('Preview of explanation-followup.png')).toBeVisible();
    });
    await step('Existing accepted file reuse requires confirmation and does not duplicate files', async () => {
      await page.goto(`${base}/portal/matter-john/documents`);
      const files = page.locator('main a[href^="/portal/matter-john/documents/"]');
      await expect(files.first()).toBeVisible();
      const before = await files.count();
      await page.getByRole('link', { name: /^Checklist/ }).click();
      await page.getByRole('link', { name: /Pay stub #3/ }).click();
      const existing = page.getByRole('button', { name: /^2025-federal-tax-return.pdf/ });
      await existing.click();
      await expect(page.getByText(/^Previously submitted file\. Not submitted/)).toBeVisible();
      await page.getByRole('button', { name: 'Cancel selection' }).click();
      await expect(page.getByText('Current file:', { exact: false })).toHaveCount(0);
      await existing.click();
      await page.getByRole('button', { name: 'Confirm submission' }).click();
      const receipt = page.getByRole('status', { name: 'Submission result' });
      await expect(receipt).toContainText('Existing file linked successfully');
      await expect(receipt).toContainText('already has an attorney acceptance');
      await expect(receipt).not.toContainText('waiting for your attorney');
      await page.getByRole('link', { name: 'Submitted files', exact: true }).click();
      await expect(files).toHaveCount(before);
    });
    await step('Client and global file lists handle empty searches', async () => {
      await page.getByLabel('Search files, clients, or matters').fill('no-matching-test-file-7392');
      await expect(page.getByText('No files match this view.')).toBeVisible();
      await expect(page.getByRole('status')).toContainText('0 files');
      await page.goto(`${base}/documents`);
      await page.getByLabel('Search files, clients, or matters').fill('no-matching-test-file-7392');
      await expect(page.getByText('No files match this view.')).toBeVisible();
      await page.getByLabel('Search files, clients, or matters').fill('');
      await expect(page.locator('main a[href^="/matters/"]').first()).toBeVisible();
    });
    await step('Broken image preview can be retried and replaced without submission', async () => {
      await page.goto(`${base}/portal/matter-john/checklist`);
      await page.getByRole('link', { name: /Pay stub #3/ }).click();
      await page.getByLabel('Choose a document').setInputFiles({ name: 'damaged.png', mimeType: 'image/png', buffer: Buffer.from('not an image') });
      await expect(page.locator('main').getByRole('alert')).toContainText('could not be previewed');
      await expect(page.getByRole('button', { name: 'Confirm submission' })).toBeDisabled();
      await page.getByRole('button', { name: 'Try preview again' }).click();
      await expect(page.locator('main').getByRole('alert')).toContainText('could not be previewed');
      const chooserPromise = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: 'Choose another file' }).click();
      await (await chooserPromise).setFiles(image('recovered.png'));
      await expect(page.getByAltText('Preview of recovered.png')).toHaveJSProperty('naturalWidth', 1);
      await expect(page.getByRole('button', { name: 'Confirm submission' })).toBeEnabled();
      await expect(page.locator('main').getByRole('alert')).toHaveCount(0);
      await page.getByRole('button', { name: 'Cancel selection' }).click();
    });
    await step('Invalid PDF contents show recovery guidance', async () => {
      await page.getByLabel('Choose a document').setInputFiles({ name: 'damaged.pdf', mimeType: 'application/pdf', buffer: Buffer.from('not a PDF') });
      await expect(page.locator('main').getByRole('alert')).toContainText('readable PDF header');
      await expect(page.getByRole('button', { name: 'Confirm submission' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Choose another file' })).toBeVisible();
      await page.getByRole('button', { name: 'Cancel selection' }).click();
    });
    await step('Long filenames and core screens fit 320px and 390px mobile widths', async () => {
      const longName = `${'statement'.repeat(18)}.png`;
      await mkdir('.next/member2-review', { recursive: true });
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 });
        await page.getByLabel('Choose a document').setInputFiles(image(longName));
        await expect(page.getByAltText(`Preview of ${longName}`)).toBeVisible();
        await noOverflow(`upload ${width}`);
        await page.getByRole('button', { name: 'Confirm submission' }).click();
        await expect(page.getByRole('status', { name: 'Submission result' })).toContainText(longName);
        await noOverflow(`confirmation ${width}`);
        await page.getByRole('link', { name: 'View submitted file', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'File details', exact: true })).toBeVisible();
        await expect(page.getByText(longName, { exact: true })).toBeVisible();
        await noOverflow(`client detail ${width}`);
        await capture(`client-detail-${width}`);
        await page.getByRole('link', { name: 'All submitted files', exact: true }).click();
        await expect(page.getByLabel('Search files, clients, or matters')).toBeVisible();
        await noOverflow(`client list ${width}`);
        await page.getByRole('link', { name: new RegExp(`^${longName.replace('.', '\\.')}`) }).first().click();
        await page.getByRole('link', { name: 'Demo: view as attorney', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Accept', exact: true })).toBeVisible();
        await noOverflow(`attorney review ${width}`);
        await page.getByRole('link', { name: 'All documents', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Documents', exact: true })).toBeVisible();
        await noOverflow(`attorney file list ${width}`);
        await page.getByRole('link', { name: new RegExp(`^${longName.replace('.', '\\.')}`) }).first().click();
        await page.getByRole('button', { name: 'Reject', exact: true }).click();
        await page.getByPlaceholder('What should the client send instead?').fill('Mobile review: please send a clearer copy.');
        await expect(page.getByRole('button', { name: 'Confirm rejection' })).toBeVisible();
        await noOverflow(`attorney rejection ${width}`);
        await capture(`attorney-review-${width}`);
        await page.getByRole('button', { name: 'Confirm rejection' }).click();
        await page.getByRole('link', { name: 'Global review queue', exact: true }).click();
        await expect(page.getByLabel('Filter by review status')).toBeVisible();
        await noOverflow(`global queue ${width}`);
        await capture(`global-queue-${width}`);
        await page.getByLabel('Filter by review status').selectOption('REJECTED');
        await page.getByLabel('Search files, clients, or matters').fill(longName);
        await page.locator('main a[href^="/matters/"]').first().click();
        await page.getByRole('link', { name: 'Demo: view file as client' }).click();
        await page.waitForURL('**/portal/matter-john/documents/*');
        await page.getByRole('button', { name: 'Open menu' }).click();
        await page.getByRole('link', { name: /^Requests/ }).click();
        await expect(page.getByText(`Returned: ${longName}`)).toBeVisible();
        await noOverflow(`client requests ${width}`);
        await capture(`requests-${width}`);
        await page.locator(`a[href="/portal/matter-john/checklist/${itemId}"]`).click();
        await expect(page.getByLabel('Choose a document')).toBeVisible();
      }
      await page.setViewportSize({ width: 1280, height: 900 });
    });
    await step('Attorney history preserves decisions and sample previews remain distinct', async () => {
      await page.getByRole('link', { name: 'View review details', exact: true }).click();
      await page.getByRole('link', { name: 'Demo: view as attorney', exact: true }).click();
      await expect(page.getByText('Returned for correction.', { exact: false })).toBeVisible();
      const history = page.getByRole('heading', { name: 'Other submissions', exact: true }).locator('..');
      await expect(history.getByRole('link').first()).toBeVisible();
      await history.getByRole('link').first().click();
      await expect(page.getByText('Returned for correction.', { exact: false })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Accept', exact: true })).toHaveCount(0);
      await page.getByRole('link', { name: 'All documents', exact: true }).click();
      await page.getByRole('link', { name: /^2025-federal-tax-return.pdf/ }).click();
      await expect(page.getByText(/^Demo sample preview/)).toBeVisible();
      await page.setViewportSize({ width: 320, height: 844 });
      await noOverflow('sample attorney preview 320');
      await capture('attorney-sample-320');
    });
    await step('Unknown and cross-matter file routes show a clear error', async () => {
      await page.goto(`${base}/portal/matter-john/documents`);
      const actualJohnFile = await page.locator('main a[href^="/portal/matter-john/documents/"]').first().getAttribute('href');
      assert.ok(actualJohnFile);
      await page.goto(`${base}/portal/matter-sarah/documents/${actualJohnFile.split('/').pop()}`);
      await expect(page.getByText('File not found in this matter.')).toBeVisible();
      await page.goto(`${base}/portal/matter-john/documents/not-a-document`);
      await expect(page.getByText('File not found in this matter.')).toBeVisible();
    });
    assert.deepEqual(errors, [], 'Browser runtime errors');
    console.log(JSON.stringify({ passed: results.length, runtimeErrors: errors }, null, 2));
  } catch (error) {
    console.error('Failure URL:', page.url());
    console.error((await page.locator('body').innerText()).slice(0, 7000));
    throw error;
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
