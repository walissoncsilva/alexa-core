const $=s=>document.querySelector(s);
const input=$('#command'),result=$('#result'),mic=$('#mic');
const sessionId=localStorage.getItem('core-session')||crypto.randomUUID();localStorage.setItem('core-session',sessionId);
function voiceState(state,msg){mic.dataset.state=state;result.textContent=msg}
async function loadDevices(){const r=await fetch('/api/devices');const d=await r.json();$('#devices').innerHTML=d.devices.map(x=>`<article class="device ${x.power?'on':''}"><small>${x.type==='light'?'ILUMINAÇÃO':x.type}</small><h3>${x.name}</h3><div class="state">${x.power?'LIGADA':'DESLIGADA'}</div><small>Brilho: ${x.brightness}%</small></article>`).join('')}
async function send(text=input.value){text=text.trim();if(!text)return;voiceState('processing','Processando comando…');const r=await fetch('/api/command',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text,sessionId})});const d=await r.json();result.textContent=d.ok?`${d.speech}\n${d.actions.map(a=>`• ${a.type.toUpperCase()} → ${a.target}`).join('\n')}`:(d.error||'Não entendi.');mic.dataset.state='idle';loadDevices()}
$('#send').onclick=()=>send();input.onkeydown=e=>{if(e.key==='Enter')send()};
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;let rec=null,listening=false;
function startVoice(){if(!SpeechRecognition){voiceState('error','Reconhecimento de voz não suportado');return}if(rec){try{rec.abort()}catch(e){}}
rec=new SpeechRecognition();rec.lang='pt-BR';rec.continuous=false;rec.interimResults=false;rec.maxAlternatives=1;let text='';
rec.onstart=()=>{listening=true;voiceState('listening','Ouvindo... fale agora')};
rec.onaudiostart=()=>voiceState('listening','Microfone ativo. Fale agora');
rec.onresult=e=>{text=e.results[0][0].transcript;input.value=text};
rec.onspeechend=()=>{try{rec.stop()}catch(e){}};
rec.onend=()=>{listening=false;if(text.trim())send(text);else voiceState('idle','Nenhuma fala detectada')};
rec.onerror=e=>{listening=false;voiceState('error','Erro voz: '+e.error)};
try{rec.start()}catch(e){voiceState('error','Falha ao iniciar voz')}}
mic.onclick=()=>{if(listening){try{rec.stop()}catch(e){}return}startVoice()};
$('#refresh').onclick=loadDevices;
$('#reset').onclick=async()=>{await fetch('/api/session/reset',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sessionId})});result.textContent='Contexto limpo.'};
document.querySelectorAll('[data-example]').forEach(b=>b.onclick=()=>{input.value=b.dataset.example;send()});
if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});loadDevices().catch(()=>$('#status').textContent='OFFLINE');