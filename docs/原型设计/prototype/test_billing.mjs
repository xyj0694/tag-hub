import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', err => errors.push(err.message));

await page.goto('http://localhost:5173/brand/billings', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(1000);

// Find and click first billing link by exact text match
const firstLink = page.locator('td').filter({ hasText: 'BILL-2026' }).first();
if (await firstLink.isVisible()) {
  await firstLink.locator('a').click();
  await page.waitForTimeout(2000);
}

await page.screenshot({ path: '/tmp/billing_modal2.png', fullPage: false });

const modal = page.locator('.ant-modal-content');
const isVisible = await modal.isVisible().catch(() => false);
console.log('ERRORS:', JSON.stringify(errors));
console.log('MODAL:', isVisible);
if (isVisible) {
  console.log('SEGMENTED:', await page.locator('.ant-segmented').isVisible().catch(() => false));
  console.log('TABLE_ROWS:', await modal.locator('.ant-table-row').count());
  console.log('EXPAND_BTNS:', await modal.locator('.ant-table-row-expand-icon').count());
  
  // Try switching to tree view
  const treeBtn = page.locator('.ant-segmented-item').filter({ hasText: '树形展开' });
  if (await treeBtn.isVisible()) {
    await treeBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/billing_tree.png', fullPage: false });
    console.log('TREE_ROWS:', await modal.locator('.ant-table-row').count());
  }
}

await browser.close();
