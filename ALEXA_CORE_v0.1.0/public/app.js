const $ = s => document.querySelector(s);
const input = $('#command');
const result = $('#result');
const sessionId = localStorage.getItem('core-session') || crypto.randomUUID();
localStorage.setItem('core-session', sessionId);

async function loadDevices() {
  const r = await fetch('/api/devices');
  const data = await r.json();
  $('#devices').innerHTML = data.devices.map(d => `
    <article class="device ${d.power ? 'on' : ''}">
      <small>${d.type === 'light' ? 'ILUMINAÇÃO' : d.type}</small>
      <h3>${d.name}</h3>
      <div class="state">${d.power ? 'LIGADA' : 'DESLIGADA'}</div>
      <small>Brilho: ${d.brightness}%</small>
    </article>`).join('');
}

async function send(text = input.value) {
  text = text.trim();
  if (!text) return;
  result.textContent = 'Interpretando…';
  const r = await fetch('/api/command', {
    method:'POST', headers:{'content-type':'application/json'},
    body:JSON.stringify({ text, sessionId })
  });
  const data = await r.json();
  result.textContent = data.ok
    ? `${data.speech}\n${data.actions.map(a => `• ${a.type.toUpperCase()} → ${a.target}${a.value != null ? ` (${a.value}%)` : ''}${a.delayMs ? ' [agendado]' : ''}`).join('\n')}`
    : data.error || data.speech || 'Não entendi.';
  await loadDevices();
}

$('#send').onclick = () => send();
input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
$('#refresh').onclick = loadDevices;
$('#reset').onclick = async () => {
  await fetch('/api/session/reset', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({sessionId}) });
  result.textContent = 'Contexto limpo.';
};
for (const b of document.querySelectorAll('[data-example]')) b.onclick = () => { input.value = b.dataset.example; send(b.dataset.example); };

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const rec = new SpeechRecognition();
  rec.lang = 'pt-BR';
  rec.interimResults = false;
  rec.onresult = e => { input.value = e.results[0][0].transcript; send(input.value); };
  rec.onerror = () => { result.textContent = 'O navegador não liberou o reconhecimento de voz. Use o campo de texto ou a Alexa.'; };
  $('#mic').onclick = () => { result.textContent = 'Ouvindo…'; rec.start(); };
} else {
  $('#mic').disabled = true;
  $('#mic').title = 'Reconhecimento de voz não suportado neste navegador';
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});
loadDevices().catch(() => { $('#status').textContent = 'OFFLINE'; });
