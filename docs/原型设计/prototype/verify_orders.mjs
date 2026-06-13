import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const errors = [];
const results = [];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on('console', msg => { if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text()); });
page.on('pageerror', err => errors.push('PAGE: ' + err.message));

try {
  // Step 1: Login
  console.log('1. Navigating to login...');
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  
  // Quick login as brand
  const quickLoginBtn = page.locator('button, a, div').filter({ hasText: /波司登|品牌方/ }).first();
  if (await quickLoginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await quickLoginBtn.click();
    console.log('   Clicked brand quick login');
  } else {
    // Try manual login
    await page.fill('input[id="username"]', 'brand@bosideng.com');
    await page.fill('input[id="password"]', '123456');
    await page.click('button[type="submit"]');
    console.log('   Manual login');
  }
  await page.waitForTimeout(2000);
  
  // Step 2: Navigate to order list
  console.log('2. Navigating to order list...');
  await page.goto(BASE + '/brand/orders', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  // Check for errors so far
  if (errors.length > 0) {
    console.log('   ERRORS after order list load:', errors.slice(0, 3));
  }
  
  // Step 3: Navigate to order 3 (已签收, has signedDocNo)
  console.log('3. Navigating to order 3 detail...');
  await page.goto(BASE + '/brand/orders/3', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2500);
  
  // Check for page errors
  if (errors.length > 0) {
    console.log('   ERRORS after order detail load:', errors.slice(-3));
  }
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/order3_detail.png', fullPage: true });
  console.log('   Screenshot saved: /tmp/order3_detail.png');
  
  // Step 4: Verify 发货运送 section
  console.log('4. Checking 发货运送 section...');
  const shippingSection = page.locator('text=发货运送').first();
  const shippingVisible = await shippingSection.isVisible({ timeout: 3000 }).catch(() => false);
  results.push({ check: '发货运送 section visible', pass: shippingVisible });
  console.log('   ' + (shippingVisible ? '✓' : '✗') + ' 发货运送 section');
  
  if (shippingVisible) {
    // Check for waybill button
    const waybillBtn = page.locator('button:has-text("查看面单")').first();
    const waybillVisible = await waybillBtn.isVisible({ timeout: 2000 }).catch(() => false);
    results.push({ check: '查看面单 button', pass: waybillVisible });
    console.log('   ' + (waybillVisible ? '✓' : '✗') + ' 查看面单 button');
    
    // Check for courier/tracking info
    const courierText = await page.locator('text=圆通速递').first().isVisible({ timeout: 2000 }).catch(() => false);
    results.push({ check: '快递公司名称 visible', pass: courierText });
    console.log('   ' + (courierText ? '✓' : '✗') + ' 快递公司名称');
  }
  
  // Step 5: Verify 签收确认 section
  console.log('5. Checking 签收确认 section...');
  const signSection = page.locator('text=签收确认').first();
  const signVisible = await signSection.isVisible({ timeout: 3000 }).catch(() => false);
  results.push({ check: '签收确认 section visible', pass: signVisible });
  console.log('   ' + (signVisible ? '✓' : '✗') + ' 签收确认 section');
  
  if (signVisible) {
    // Check for 回签单
    const signedDocBtn = page.locator('button:has-text("查看回签单")').first();
    const signedDocVisible = await signedDocBtn.isVisible({ timeout: 2000 }).catch(() => false);
    results.push({ check: '查看回签单 button', pass: signedDocVisible });
    console.log('   ' + (signedDocVisible ? '✓' : '✗') + ' 查看回签单 button');
    
    // Check for 回签单号
    const docNoText = await page.locator('text=ESIGN-2026').first().isVisible({ timeout: 2000 }).catch(() => false);
    results.push({ check: '回签单号 visible', pass: docNoText });
    console.log('   ' + (docNoText ? '✓' : '✗') + ' 回签单号');
  }
  
  // Also test order 53 (one we patched)
  console.log('6. Testing order 53 (newly patched 已签收)...');
  await page.goto(BASE + '/brand/orders/53', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/order53_detail.png', fullPage: true });
  console.log('   Screenshot saved: /tmp/order53_detail.png');
  
  const signedDoc53 = await page.locator('text=ESIGN-2026').first().isVisible({ timeout: 3000 }).catch(() => false);
  results.push({ check: 'Order 53 回签单', pass: signedDoc53 });
  console.log('   ' + (signedDoc53 ? '✓' : '✗') + ' Order 53 回签单 visible');
  
} catch (e) {
  console.log('TEST ERROR:', e.message);
  errors.push('TEST: ' + e.message);
}

// Summary
console.log('\n=== VERIFICATION SUMMARY ===');
const passCount = results.filter(r => r.pass).length;
console.log(`${passCount}/${results.length} checks passed`);
results.forEach(r => console.log(`  ${r.pass ? '✓' : '✗'} ${r.check}`));

if (errors.length > 0) {
  console.log('\nErrors encountered:');
  errors.forEach(e => console.log('  ', e.slice(0, 300)));
}

await browser.close();
