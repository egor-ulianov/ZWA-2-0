async function installDeterministicNetwork(page, { allowApi = false } = {}) {
  await page.route('https://**/*', (route) => route.abort());
  if (!allowApi) await page.route('**/api/**', (route) => route.abort());
}

async function fulfillJson(route, payload, { status = 200, headers = {} } = {}) {
  await route.fulfill({
    status,
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  });
}

export { fulfillJson, installDeterministicNetwork };
