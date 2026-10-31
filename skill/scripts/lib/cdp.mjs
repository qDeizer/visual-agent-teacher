// Minimal Chrome DevTools Protocol client: launches a headless Chromium browser
// (Edge or Chrome) and talks to it over the WebSocket built into Node ≥ 22. No npm packages.
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CANDIDATES = [
  process.env.VAT_BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge',
].filter(Boolean)

export function findBrowser() {
  const p = CANDIDATES.find(c => existsSync(c))
  if (!p) throw new Error('No Chromium-based browser found. Install Edge or Chrome, or set VAT_BROWSER to its executable path.')
  return p
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

export async function launch({ width = 1440, height = 900 } = {}) {
  const exe = findBrowser()
  const profile = mkdtempSync(join(tmpdir(), 'vat-cdp-'))
  const proc = spawn(exe, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--hide-scrollbars', '--mute-audio', '--allow-file-access-from-files',
    `--window-size=${width},${height}`, `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] })

  const port = await new Promise((resolve, reject) => {
    let buf = ''
    const t = setTimeout(() => reject(new Error('Browser did not start (no DevTools port within 20s)')), 20000)
    proc.stderr.on('data', d => {
      buf += d
      const m = buf.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//)
      if (m) { clearTimeout(t); resolve(Number(m[1])) }
    })
    proc.on('exit', code => { clearTimeout(t); reject(new Error(`Browser exited early (code ${code})`)) })
  })

  let targets
  for (let i = 0; i < 50; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (targets.some(t => t.type === 'page')) break } catch {}
    await sleep(100)
  }
  const page = targets.find(t => t.type === 'page')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })

  let id = 0
  const pending = new Map()
  const listeners = []
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id); pending.delete(msg.id)
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
    } else if (msg.method) listeners.forEach(l => l(msg))
  }
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id; pending.set(mid, { resolve, reject }); ws.send(JSON.stringify({ id: mid, method, params }))
  })

  const consoleMessages = []
  listeners.push(m => {
    if (m.method === 'Runtime.consoleAPICalled') consoleMessages.push({ type: m.params.type, text: m.params.args.map(a => a.value ?? a.description ?? '').join(' ') })
    if (m.method === 'Runtime.exceptionThrown') consoleMessages.push({ type: 'exception', text: m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text })
  })
  await send('Runtime.enable')
  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })

  const api = {
    send,
    console: consoleMessages,
    async goto(url) {
      const loaded = new Promise(r => listeners.push(m => { if (m.method === 'Page.loadEventFired') r() }))
      await send('Page.navigate', { url })
      await loaded
    },
    /** Evaluate an expression (or async function source) in the page and return its JSON value. */
    async eval(expression, { timeout = 60000 } = {}) {
      const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, timeout })
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
      return r.result.value
    },
    async screenshot(clip) {
      const r = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) })
      return Buffer.from(r.data, 'base64')
    },
    async close() {
      try { ws.close() } catch {}
      proc.kill()
      await sleep(300)
      try { rmSync(profile, { recursive: true, force: true }) } catch {}
    },
  }
  return api
}
