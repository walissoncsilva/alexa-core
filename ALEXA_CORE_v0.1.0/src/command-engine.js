const ROOM_ALIASES = {
  sala: ['sala', 'sala de estar'],
  corredor: ['corredor'],
  quarto: ['quarto', 'dormitorio', 'dormitório'],
  cozinha: ['cozinha'],
  varanda: ['varanda'],
  banheiro: ['banheiro']
};

const normalize = (text = '') => text
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\bluz(?:es)?\b/g, '')
  .replace(/\blampada(?:s)?\b/g, '')
  .replace(/[!?]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function roomFromText(text) {
  const n = normalize(text);
  for (const [room, aliases] of Object.entries(ROOM_ALIASES)) {
    if (aliases.some(a => n.includes(normalize(a)))) return room;
  }
  return null;
}

function roomsFromText(text) {
  const n = normalize(text);
  return Object.entries(ROOM_ALIASES)
    .filter(([, aliases]) => aliases.some(a => n.includes(normalize(a))))
    .map(([room]) => room);
}

function brightnessFromText(text) {
  const m = normalize(text).match(/(?:em|a|para)?\s*(\d{1,3})\s*%|(?:em|a|para)\s*(\d{1,3})\s*por cento/);
  const value = Number(m?.[1] ?? m?.[2]);
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, value));
}

function delayFromText(text) {
  const n = normalize(text);
  const m = n.match(/daqui a\s+(\d+)\s*(segundo|minuto|hora)s?/);
  if (!m) return null;
  const count = Number(m[1]);
  const unit = m[2];
  const multiplier = unit === 'segundo' ? 1000 : unit === 'minuto' ? 60000 : 3600000;
  return count * multiplier;
}

function actionFromText(text, inheritedAction = null) {
  const n = normalize(text);
  if (/\b(apague|apagar|desligue|desligar)\b/.test(n)) return 'off';
  if (/\b(acenda|acender|ligue|ligar)\b/.test(n)) return 'on';
  if (/\b(diminua|reduza|deixe|coloque|ajuste)\b/.test(n) && brightnessFromText(n) !== null) return 'brightness';
  if (/\btambem\b/.test(n) && inheritedAction) return inheritedAction;
  return inheritedAction;
}

function splitClauses(text) {
  return normalize(text)
    .replace(/\s*,\s*/g, ' e ')
    .split(/\s+e\s+(?=(?:acenda|acender|ligue|ligar|apague|apagar|desligue|desligar|deixe|coloque|ajuste|diminua|reduza|o |a |os |as |cozinha|sala|corredor|quarto|varanda|banheiro))/)
    .map(s => s.trim())
    .filter(Boolean);
}

function parseException(text) {
  const n = normalize(text);
  const m = n.match(/\bmenos\s+(.+)$/);
  return m ? roomsFromText(m[1]) : [];
}

export function parseCommand(rawText, context = {}) {
  const text = normalize(rawText);
  const delayMs = delayFromText(text);
  const exceptions = parseException(text);
  const clauses = splitClauses(text.replace(/\bmenos\s+.+$/, '').trim());
  const actions = [];
  let inheritedAction = context.lastAction ?? null;

  // Global commands: "apague tudo", "acenda tudo", with optional exception.
  if (/\b(tudo|todas|todos)\b/.test(text)) {
    const action = actionFromText(text, inheritedAction);
    if (action === 'on' || action === 'off') {
      actions.push({ type: action, target: '*', exclude: exceptions, delayMs });
      return {
        ok: true,
        text: rawText,
        actions,
        context: { ...context, lastAction: action, lastTargets: ['*'] }
      };
    }
  }

  for (const clause of clauses) {
    const action = actionFromText(clause, inheritedAction);
    let rooms = roomsFromText(clause);

    // Context continuation: "também", "esse também", etc.
    if (!rooms.length && /\btambem\b/.test(clause) && context.lastTarget) {
      rooms = [context.lastTarget];
    }

    if (!rooms.length) continue;

    const brightness = brightnessFromText(clause);
    const effectiveAction = brightness !== null ? 'brightness' : action;
    if (!effectiveAction) continue;

    for (const room of rooms) {
      actions.push({
        type: effectiveAction,
        target: room,
        ...(brightness !== null ? { value: brightness } : {}),
        ...(delayMs ? { delayMs } : {})
      });
    }
    inheritedAction = effectiveAction === 'brightness' ? 'on' : effectiveAction;
  }

  // If clause splitting didn't capture implicit room lists: "acenda corredor e quarto".
  if (!actions.length) {
    const action = actionFromText(text, inheritedAction);
    const rooms = roomsFromText(text);
    const brightness = brightnessFromText(text);
    for (const room of rooms) {
      actions.push({
        type: brightness !== null ? 'brightness' : action,
        target: room,
        ...(brightness !== null ? { value: brightness } : {}),
        ...(delayMs ? { delayMs } : {})
      });
    }
  }

  const last = actions.at(-1);
  return {
    ok: actions.length > 0,
    text: rawText,
    actions,
    context: {
      ...context,
      ...(last ? { lastAction: last.type === 'brightness' ? 'on' : last.type, lastTarget: last.target } : {}),
      lastTargets: actions.map(a => a.target)
    }
  };
}
