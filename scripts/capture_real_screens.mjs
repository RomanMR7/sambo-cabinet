import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import os from 'os';

const PORT = 4173;
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'manual-assets');
const ARTIFACT_DIR = "C:\\Users\\User\\.gemini\\antigravity\\brain\\7554c45e-49cc-4f0c-8956-de52ade44638";

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  let filePath = path.join(DIST_DIR, reqPath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise((resolve) => server.listen(PORT, resolve));
console.log(`[Server] Static server running on http://127.0.0.1:${PORT}`);

const tempProfile = path.join(os.tmpdir(), `chrome_manual_${Date.now()}`);
fs.mkdirSync(tempProfile, { recursive: true });

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  '--disable-gpu',
  '--remote-debugging-port=9222',
  `--user-data-dir=${tempProfile}`,
  '--window-size=1440,920',
  'about:blank'
], { stdio: 'ignore' });

// Wait for Chrome CDP port to open
let targets = null;
for (let i = 0; i < 20; i++) {
  await new Promise(r => setTimeout(r, 300));
  try {
    const res = await fetch('http://127.0.0.1:9222/json/list');
    targets = await res.json();
    if (targets && targets.length > 0) break;
  } catch (e) {}
}

const pageTarget = targets.find(t => t.type === 'page') || targets[0];
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let msgId = 1;
const pending = new Map();

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(msg.error);
    else resolve(msg.result);
  }
};

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(code) {
  const res = await send('Runtime.evaluate', { expression: code, returnByValue: true, awaitPromise: true });
  return res?.result?.value;
}

async function takeScreenshot(name) {
  const res = await send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(res.data, 'base64');
  
  const destPublic = path.join(OUTPUT_DIR, `${name}.png`);
  fs.writeFileSync(destPublic, buffer);
  
  const destArtifact = path.join(ARTIFACT_DIR, `${name}.png`);
  try {
    fs.writeFileSync(destArtifact, buffer);
  } catch (e) {}
  
  console.log(`[Screenshot Saved] -> ${name}.png (${buffer.length} bytes)`);
}

await send('Page.enable');
await send('Runtime.enable');

console.log('[Navigation] Opening app at http://127.0.0.1:' + PORT);
await send('Page.navigate', { url: `http://127.0.0.1:${PORT}` });
await new Promise(r => setTimeout(r, 2000));

// 1. Screen 1: Coach Today View
console.log('Capturing: screen-1-coach-today');
await takeScreenshot('screen-1-coach-today');

// 2. Screen 2: Coach Reports ("Отчёты и Регулярность") - exact match to user's screen!
console.log('Capturing: screen-2-coach-reports');
await evaluate(`
  const btn = Array.from(document.querySelectorAll('nav button')).find(b => b.innerText.includes('Отчёты'));
  if (btn) btn.click();
`);
await new Promise(r => setTimeout(r, 1000));
await takeScreenshot('screen-2-coach-reports');

// 3. Screen 3: Coach Athletes List
console.log('Capturing: screen-3-coach-athletes');
await evaluate(`
  const btn = Array.from(document.querySelectorAll('nav button')).find(b => b.innerText.includes('Спортсмены'));
  if (btn) btn.click();
`);
await new Promise(r => setTimeout(r, 1000));
await takeScreenshot('screen-3-coach-athletes');

// 4. Screen 4: Athlete Detail (Anton K.) and SEND DOCUMENT UPDATE REQUEST
console.log('Capturing: screen-4-athlete-detail');
await evaluate(`
  const rows = Array.from(document.querySelectorAll('div, button, tr'));
  const antonCard = rows.find(el => el.textContent && el.textContent.includes('Антон Кузнецов') && el.tagName === 'BUTTON') ||
                    rows.find(el => el.textContent && el.textContent.includes('Антон К.') && el.tagName === 'BUTTON');
  if (antonCard) {
    antonCard.click();
  }
`);
await new Promise(r => setTimeout(r, 1000));

// Click "Запросить обновление полиса"
await evaluate(`
  const btns = Array.from(document.querySelectorAll('button'));
  const reqBtn = btns.find(b => b.textContent && b.textContent.includes('Запросить обновление полиса')) ||
                 btns.find(b => b.textContent && b.textContent.includes('Запросить у родителя'));
  if (reqBtn) reqBtn.click();
`);
await new Promise(r => setTimeout(r, 1000));
await takeScreenshot('screen-4-athlete-detail');

// 5. Screen 5: Parent View with URGENT ALERT BANNER
console.log('Capturing: screen-5-parent-view');
await evaluate(`
  const parentBtn = Array.from(document.querySelectorAll('header button')).find(b => b.textContent.includes('Родитель'));
  if (parentBtn) parentBtn.click();
`);
await new Promise(r => setTimeout(r, 1200));
await takeScreenshot('screen-5-parent-view');

// 6. Screen 5b: Parent Upload Document Modal Open
console.log('Capturing: screen-5b-parent-modal');
await evaluate(`
  const uploadBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('Загрузить обновлённый документ') || b.textContent.includes('Передать документ')));
  if (uploadBtn) uploadBtn.click();
`);
await new Promise(r => setTimeout(r, 1000));
await takeScreenshot('screen-5b-parent-modal');

// Close modal
await evaluate(`
  const closeBtn = document.querySelector('div[role="dialog"] button') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Отмена'));
  if (closeBtn) closeBtn.click();
`);
await new Promise(r => setTimeout(r, 500));

// 7. Screen 6: Verifier View
console.log('Capturing: screen-6-verifier-view');
await evaluate(`
  const verifierBtn = Array.from(document.querySelectorAll('header button')).find(b => b.textContent.includes('Проверяющий'));
  if (verifierBtn) verifierBtn.click();
`);
await new Promise(r => setTimeout(r, 1200));
await takeScreenshot('screen-6-verifier-view');

console.log('[Done] All real screenshots captured successfully!');

ws.close();
chrome.kill();
server.close();
process.exit(0);
