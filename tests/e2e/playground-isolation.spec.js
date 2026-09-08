const { test, expect } = require('@playwright/test');
const { installDeterministicNetwork } = require('./helpers/browser.js');

test('hostile student JavaScript cannot mutate the parent or block later sandbox use', async ({
  page,
}) => {
  await installDeterministicNetwork(page);

  let protectedRequests = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/attendance') protectedRequests += 1;
  });

  await page.goto('/interactive-zwa-5-js?slide=tasks');
  await page.evaluate(() => {
    document.documentElement.dataset.playgroundHostMutation = 'clean';
  });
  const editor = page.locator('textarea').first();
  await expect(editor).toBeVisible();

  await editor.fill(`
    try { parent.document.documentElement.dataset.playgroundHostMutation = "owned"; } catch (_) {}
    try { document.cookie = "hostCookie=owned"; } catch (_) {}
    try { localStorage.setItem("hostStorage", "owned"); sessionStorage.setItem("hostSession", "owned"); } catch (_) {}
    try {
      const form = document.createElement("form");
      form.action = "/api/attendance";
      form.method = "post";
      document.body.appendChild(form);
      form.submit();
    } catch (_) {}
    try { fetch("/api/attendance", { method: "POST", body: "owned" }).catch(() => {}); } catch (_) {}
    try { parent.postMessage({ channel: "zwa-playground", version: 1, token: "wrong", type: "unknown" }, "*"); } catch (_) {}
  `);
  await page.getByRole('button', { name: 'Run + Check' }).click();
  await expect(page.getByText('Code executed', { exact: true })).toBeVisible();

  await expect(page.locator('html')).toHaveAttribute('data-playground-host-mutation', 'clean');
  await expect.poll(() => protectedRequests).toBe(0);
  const hostStorage = await page.evaluate(() => ({
    local: window.localStorage.getItem('hostStorage'),
    session: window.sessionStorage.getItem('hostSession'),
    cookie: document.cookie,
  }));
  expect(hostStorage).toEqual({ local: null, session: null, cookie: '' });

  await editor.fill('exports.greeting = "Ahoj"; exports.double = (n) => n * 2;');
  await page.getByRole('button', { name: 'Run + Check' }).click();
  await expect(page.getByText("exports.greeting === 'Ahoj'", { exact: true })).toBeVisible();
  await expect(page.getByText('exports.double(10) === 20', { exact: true })).toBeVisible();
  await expect(page.locator('iframe[title="JavaScript DOM sandbox"]')).toBeVisible();
});
