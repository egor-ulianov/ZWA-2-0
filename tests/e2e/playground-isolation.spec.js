import { createRequire } from 'node:module';

const { expect, test } = createRequire(import.meta.url)('@playwright/test');
import { installDeterministicNetwork } from './helpers/browser.js';

const playgroundLessons = [
  {
    name: 'HTML5 static preview',
    href: '/interactive-zwa-1-html5?slide=tasks',
    verify: async (page) => {
      await expect(page.getByText('Vyberte úkol', { exact: true })).toBeVisible();
    },
  },
  {
    name: 'HTML forms interaction',
    href: '/interactive-zwa-2-forms?slide=playground',
    verify: async (page) => {
      await page.getByRole('button', { name: 'Vyzkoušet' }).first().click();
      await expect(page.getByLabel('Jméno')).toBeVisible();
      await page.getByLabel('Jméno').fill('Ada');
      await expect(page.getByLabel('Jméno')).toHaveValue('Ada');
    },
  },
  {
    name: 'CSS static preview',
    href: '/interactive-zwa-2?slide=tasks',
    frameTitle: 'CSS playground preview',
  },
  {
    name: 'CSS II static preview',
    href: '/interactive-zwa-5-css-ii?slide=tasks',
    frameTitle: 'CSS layout playground preview',
  },
  {
    name: 'JavaScript sandbox preview',
    href: '/interactive-zwa-5-js?slide=tasks',
    frameTitle: 'JavaScript DOM sandbox',
  },
];

for (const playground of playgroundLessons) {
  test(`playground lesson supports ${playground.name}`, async ({ page }) => {
    await installDeterministicNetwork(page);

    const response = await page.goto(playground.href);
    expect(response).not.toBeNull();
    expect(response.ok()).toBe(true);

    if (playground.frameTitle) {
      await expect(page.locator(`iframe[title="${playground.frameTitle}"]`)).toBeVisible();
    }
    await playground.verify?.(page);
  });
}

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
