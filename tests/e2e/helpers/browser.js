async function installDeterministicNetwork(page) {
  await page.route('https://**/*', (route) => route.abort());
  await page.route('**/api/**', (route) => route.abort());
}

async function fulfillJson(route, payload, { status = 200, headers = {} } = {}) {
  await route.fulfill({
    status,
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  });
}

module.exports = { fulfillJson, installDeterministicNetwork };
