import { processCommand, resetSession } from './orchestrator.js';

function alexaResponse(text, shouldEndSession = false, reprompt = 'Pode falar.') {
  return {
    version: '1.0',
    response: {
      outputSpeech: { type: 'PlainText', text },
      ...(shouldEndSession ? {} : { reprompt: { outputSpeech: { type: 'PlainText', text: reprompt } } }),
      shouldEndSession
    }
  };
}

export function handleAlexaCustom(req) {
  const request = req.body?.request ?? {};
  const sessionId = req.body?.session?.sessionId ?? 'alexa';

  if (request.type === 'LaunchRequest') {
    return alexaResponse('Modo comando ativo. Pode falar.', false);
  }

  if (request.type === 'SessionEndedRequest') {
    resetSession(sessionId);
    return { version: '1.0', response: {} };
  }

  if (request.type === 'IntentRequest') {
    const intent = request.intent ?? {};
    if (intent.name === 'AMAZON.StopIntent' || intent.name === 'AMAZON.CancelIntent') {
      resetSession(sessionId);
      return alexaResponse('Modo comando encerrado.', true);
    }

    if (intent.name === 'AMAZON.HelpIntent') {
      return alexaResponse('Diga, por exemplo: apague a sala e acenda o corredor e o quarto.', false);
    }

    const slots = intent.slots ?? {};
    const raw = slots.command?.value || buildFromStructuredSlots(slots);
    if (!raw) return alexaResponse('Não consegui identificar o comando. Tente novamente.', false);

    const result = processCommand(raw, sessionId);
    return alexaResponse(result.speech, false);
  }

  return alexaResponse('Pode falar.', false);
}

function buildFromStructuredSlots(slots) {
  const action = slots.action?.value ?? '';
  const room1 = slots.room1?.value ?? '';
  const room2 = slots.room2?.value ?? '';
  const room3 = slots.room3?.value ?? '';
  const brightness = slots.brightness?.value ?? '';
  return [action, room1, room2 && `e ${room2}`, room3 && `e ${room3}`, brightness && `em ${brightness} por cento`]
    .filter(Boolean).join(' ').trim();
}
