// ALEXA CORE v0.1.0 — adaptador Lambda para Multi-Capability Skill.
// Variáveis de ambiente:
// CORE_BASE_URL=https://seu-core.onrender.com
// CORE_API_KEY=<mesma chave configurada no Core>

const CORE = String(process.env.CORE_BASE_URL || '').replace(/\/$/, '');
const KEY = String(process.env.CORE_API_KEY || '');

async function core(path, options = {}) {
  if (!CORE) throw new Error('CORE_BASE_URL não configurada');
  const headers = { 'content-type': 'application/json', ...(KEY ? { 'x-core-key': KEY } : {}), ...(options.headers || {}) };
  const r = await fetch(`${CORE}${path}`, { ...options, headers });
  if (!r.ok) throw new Error(`Core respondeu HTTP ${r.status}`);
  return r.json();
}

function customResponse(text, shouldEndSession = false) {
  return {
    version: '1.0',
    response: {
      outputSpeech: { type: 'PlainText', text },
      ...(shouldEndSession ? {} : { reprompt: { outputSpeech: { type: 'PlainText', text: 'Pode falar.' } } }),
      shouldEndSession
    }
  };
}

function commandFromSlots(slots = {}) {
  if (slots.command?.value) return slots.command.value;
  const action = slots.action?.value || '';
  const room1 = slots.room1?.value || '';
  const room2 = slots.room2?.value || '';
  const room3 = slots.room3?.value || '';
  const brightness = slots.brightness?.value || '';
  return [action, room1, room2 && `e ${room2}`, room3 && `e ${room3}`, brightness && `em ${brightness} por cento`]
    .filter(Boolean).join(' ').trim();
}

async function handleCustom(event) {
  const request = event.request || {};
  const sessionId = event.session?.sessionId || 'alexa';

  if (request.type === 'LaunchRequest') return customResponse('Modo comando ativo. Pode falar.');
  if (request.type === 'SessionEndedRequest') return { version: '1.0', response: {} };

  if (request.type === 'IntentRequest') {
    const name = request.intent?.name;
    if (name === 'AMAZON.StopIntent' || name === 'AMAZON.CancelIntent') return customResponse('Modo comando encerrado.', true);
    if (name === 'AMAZON.HelpIntent') return customResponse('Diga, por exemplo: apague a sala e acenda o corredor e o quarto.');
    const text = commandFromSlots(request.intent?.slots);
    if (!text) return customResponse('Não consegui identificar o comando. Tente novamente.');
    const result = await core('/api/command', { method: 'POST', body: JSON.stringify({ text, sessionId }) });
    return customResponse(result.speech || (result.ok ? 'Pronto.' : 'Não entendi.'));
  }
  return customResponse('Pode falar.');
}

function endpoint(id, name) {
  return {
    endpointId: id,
    manufacturerName: 'ALEXA CORE',
    friendlyName: name,
    description: `Iluminação ${name} via ALEXA CORE`,
    displayCategories: ['LIGHT'],
    cookie: {},
    capabilities: [
      { type: 'AlexaInterface', interface: 'Alexa', version: '3' },
      { type: 'AlexaInterface', interface: 'Alexa.PowerController', version: '3', properties: { supported: [{ name: 'powerState' }], proactivelyReported: false, retrievable: true } },
      { type: 'AlexaInterface', interface: 'Alexa.BrightnessController', version: '3', properties: { supported: [{ name: 'brightness' }], proactivelyReported: false, retrievable: true } }
    ]
  };
}

async function handleSmartHome(event) {
  const directive = event.directive || {};
  const header = directive.header || {};
  const endpointId = directive.endpoint?.endpointId;

  if (header.namespace === 'Alexa.Discovery' && header.name === 'Discover') {
    const data = await core('/api/devices');
    return {
      event: {
        header: { namespace: 'Alexa.Discovery', name: 'Discover.Response', payloadVersion: '3', messageId: crypto.randomUUID() },
        payload: { endpoints: data.devices.map(d => endpoint(d.id, d.name)) }
      }
    };
  }

  let action;
  if (header.namespace === 'Alexa.PowerController' && header.name === 'TurnOn') action = { type: 'on', target: endpointId };
  if (header.namespace === 'Alexa.PowerController' && header.name === 'TurnOff') action = { type: 'off', target: endpointId };
  if (header.namespace === 'Alexa.BrightnessController' && header.name === 'SetBrightness') action = { type: 'brightness', target: endpointId, value: Number(directive.payload?.brightness) };

  if (!action) throw new Error(`Diretiva não suportada: ${header.namespace}/${header.name}`);
  const data = await core('/api/device/action', { method: 'POST', body: JSON.stringify(action) });
  const state = data.results?.[0]?.state || {};
  const now = new Date().toISOString();
  const properties = [
    { namespace: 'Alexa.PowerController', name: 'powerState', value: state.power ? 'ON' : 'OFF', timeOfSample: now, uncertaintyInMilliseconds: 0 },
    { namespace: 'Alexa.BrightnessController', name: 'brightness', value: Number(state.brightness ?? 100), timeOfSample: now, uncertaintyInMilliseconds: 0 }
  ];

  return {
    context: { properties },
    event: {
      header: {
        namespace: 'Alexa', name: 'Response', payloadVersion: '3',
        messageId: crypto.randomUUID(), correlationToken: header.correlationToken
      },
      endpoint: { endpointId },
      payload: {}
    }
  };
}

export async function handler(event) {
  try {
    if (event?.directive) return await handleSmartHome(event);
    if (event?.request) return await handleCustom(event);
    throw new Error('Formato Alexa desconhecido');
  } catch (error) {
    console.error(error);
    if (event?.directive) {
      return {
        event: {
          header: { namespace: 'Alexa', name: 'ErrorResponse', payloadVersion: '3', messageId: crypto.randomUUID(), correlationToken: event.directive?.header?.correlationToken },
          endpoint: event.directive?.endpoint ? { endpointId: event.directive.endpoint.endpointId } : undefined,
          payload: { type: 'ENDPOINT_UNREACHABLE', message: error.message }
        }
      };
    }
    return customResponse('Não consegui acessar o núcleo de automação. Tente novamente.', true);
  }
}
