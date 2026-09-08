import { parseCommand } from './command-engine.js';
import { executeAction } from './device-store.js';

const sessions = new Map();
const timers = new Set();

export function processCommand(text, sessionId = 'web') {
  const context = sessions.get(sessionId) ?? {};
  const parsed = parseCommand(text, context);
  if (!parsed.ok) {
    return { ok: false, speech: 'Não entendi uma ação executável.', actions: [], results: [] };
  }

  sessions.set(sessionId, parsed.context);
  const results = [];

  for (const action of parsed.actions) {
    if (action.delayMs) {
      const timer = setTimeout(() => {
        executeAction({ ...action, delayMs: undefined });
        timers.delete(timer);
      }, action.delayMs);
      timers.add(timer);
      results.push({ ok: true, scheduled: true, target: action.target, delayMs: action.delayMs });
    } else {
      results.push(...executeAction(action));
    }
  }

  const scheduled = parsed.actions.some(a => a.delayMs);
  return {
    ok: true,
    speech: scheduled ? 'Certo. Ações programadas.' : 'Pronto.',
    actions: parsed.actions,
    results
  };
}

export function resetSession(sessionId = 'web') {
  sessions.delete(sessionId);
}
