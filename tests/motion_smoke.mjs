import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = process.env.SAKURAYO_ENTRY || process.argv[2] || 'src/index.html';
const url = pathToFileURL(path.resolve(root, entry)).href + '?test=1';
const browser = await chromium.launch({headless: true});
try {
  const page = await browser.newPage({viewport: {width: 932, height: 430}});
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  const time = () => page.evaluate(() => window.SakurayoLive.snapshot().t);
  const ready = async () => {
    await page.goto(url);
    await page.locator('.bootArt35').waitFor({state: 'detached'});
  };
  const toggle = async () => {
    await page.locator('#commandSettings47').click();
    await page.locator('[data-toggle="fx"]').click();
    await page.keyboard.press('Escape');
  };
  const stopped = async (label) => {
    await page.waitForTimeout(100);
    const before = await time();
    await page.waitForTimeout(160);
    assert.equal(await time(), before, label);
    assert.match(await page.locator('#commandHeading47 img').evaluate(node => node.currentSrc), /command-seal-still\.webp$/);
    assert.equal(await page.locator('.heroLiveSway46').evaluate(node => getComputedStyle(node).animationName), 'none');
  };
  const moving = async () => {
    const before = await time();
    await page.waitForTimeout(160);
    assert.ok((await time()) > before, 'enabling motion restarts the live loop without opening another UI');
    assert.match(await page.locator('#commandHeading47 img').evaluate(node => node.currentSrc), /command-seal-loop\.webp$/);
  };
  await ready();
  await toggle();
  await stopped('user simplified effects stop the lobby live loop');
  await ready();
  await stopped('simplified effects persist across reload');
  await toggle();
  await moving();
  await page.emulateMedia({reducedMotion: 'reduce'});
  await stopped('system reduced motion stops the live loop');
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await moving();
  assert.deepEqual(errors, []);
  console.log('PASS motion smoke: user preference, persistence, static art, system change and live resume');
} finally {
  await browser.close();
}
