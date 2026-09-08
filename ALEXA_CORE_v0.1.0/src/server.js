import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { processCommand, resetSession } from './orchestrator.js';
import { listDevices, executeAction } from './device-store.js';
import { handleAlexaCustom } from './alexa-custom.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const port = Number(process.env.PORT || 3000);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml'
};

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 131072) throw new Error('Payload muito grande');
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

async function serveStatic(urlPath, res) {
  let rel = decodeURIComponent(urlPath === '/' ? '/index.html' : urlPath);
  rel = rel.replace(/^\/+/, '');
  const filePath = path.resolve(publicDir, rel);
  if (!filePath.startsWith(path.resolve(publicDir) + path.sep) && filePath !== path.resolve(publicDir, 'index.html')) return false;
  try {
    const data = await fs.readFile(filePath);
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME[path.extname(filePath)] || 'application/octet-stream');
    res.end(data);
    return true;
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  setSecurityHeaders(res);
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      return json(res, 200, { ok: true, app: 'ALEXA CORE', version: '0.1.0' });
    }
    if (req.method === 'GET' && url.pathname === '/api/devices') {
      return json(res, 200, { devices: listDevices() });
    }
    if (req.method === 'POST' && url.pathname === '/api/command') {
      const body = await readJson(req);
      const text = String(body?.text ?? '').trim();
      const sessionId = String(body?.sessionId ?? 'web');
      if (!text) return json(res, 400, { ok: false, error: 'Informe um comando.' });
      return json(res, 200, processCommand(text, sessionId));
    }
    if (req.method === 'POST' && url.pathname === '/api/session/reset') {
      const body = await readJson(req);
      resetSession(String(body?.sessionId ?? 'web'));
      return json(res, 200, { ok: true });
    }
    if (req.method === 'POST' && url.pathname === '/api/device/action') {
      const requiredKey = process.env.CORE_API_KEY;
      if (requiredKey && req.headers['x-core-key'] !== requiredKey) {
        return json(res, 401, { ok: false, error: 'Não autorizado' });
      }
      const body = await readJson(req);
      const action = {
        type: String(body?.type ?? ''),
        target: String(body?.target ?? ''),
        ...(body?.value != null ? { value: Number(body.value) } : {})
      };
      if (!['on', 'off', 'brightness'].includes(action.type) || !action.target) {
        return json(res, 400, { ok: false, error: 'Ação inválida' });
      }
      return json(res, 200, { ok: true, results: executeAction(action) });
    }
    if (req.method === 'POST' && url.pathname === '/alexa/custom') {
      const body = await readJson(req);
      return json(res, 200, handleAlexaCustom({ body }));
    }
    if (req.method === 'GET' && await serveStatic(url.pathname, res)) return;
    return json(res, 404, { ok: false, error: 'Rota não encontrada' });
  } catch (error) {
    return json(res, 400, { ok: false, error: error.message || 'Requisição inválida' });
  }
});

server.listen(port, '0.0.0.0', () => console.log(`ALEXA CORE v0.1.0 em http://localhost:${port}`));
