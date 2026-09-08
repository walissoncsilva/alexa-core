const $=s=>document.querySelector(s);
const input=$('#command'),result=$('#result'),mic=$('#mic');
const sessionId=localStorage.getItem('core-session')||crypto.randomUUID();localStorage.setItem('core-session',sessionId);
function voiceState(state,msg){mic.dataset.state=state;result.textContent=msg}
async function loadDevices(){const r=await fetch('/api/devices');const d=await r.json();$('#devices').innerHTML=d.devices.map(x=>`<article class="device ${x.power?'on':''}"><small>${x.type==='light'?'ILUMINAÇÃO':x.type}</small><h3>${x.name}</h3><div class="state">${x.power?'LIGADA':'DESLIGADA'}</div><small>Brilho: ${x.brightness}%</small></article>`).join('')}
async function send(text=input.value){text=text.trim();if(!text)return;voiceState('processing','Processando comando…');const r=await fetch('/api/command',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text,sessionId})});const d=await r.json();result.textContent=d.ok?`${d.speech}\n${d.actions.map(a=>`• ${a.type.toUpperCase()} → ${a.target}${a.value!=null?` (${a.value}%)`:''}`).join('\n')}`:(d.error||'Não entendi.');mic.dataset.state='idle';loadDevices()}
$('#send').onclick=()=>send();input.onkeydown=e=>{if(e.key==='Enter')send()};$('#refresh').onclick=loadDevices;$('#reset').onclick=async()=>{await fetch('/api/session/reset',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sessionId})});result.textContent='Contexto limpo.'};
document.querySelectorAll('[data-example]').forEach(b=>b.onclick=()=>{input.value=b.dataset.example;send()});
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;let rec=null,listening=false,timer=null,voiceText='';
function createRecognition(){const r=new SpeechRecognition();r.lang='pt-BR';r.continuous=false;r.interimResults=true;r.maxAlternatives=5;
r.onstart=()=>{listening=true;voiceText='';voiceState('listening','Ouvindo… fale agora');clearTimeout(timer);timer=setTimeout(()=>{try{r.abort()}catch(e){};listening=false;voiceState('idle','Tempo limite de escuta. Tente novamente.')},8000)};
r.onaudiostart=()=>voiceState('listening','Microfone ativo. Fale agora');
r.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){voiceText+=e.results[i][0].transcript+' ';}input.value=voiceText.trim()};
r.onnomatch=()=>voiceState('idle','Não reconheci a fala.');
r.onend=()=>{listening=false;clearTimeout(timer);if(voiceText.trim())send(voiceText);else voiceState('idle','Nenhuma fala detectada. Tente novamente.')};
r.onerror=e=>{listening=false;clearTimeout(timer);voiceState('error',`Falha de voz: ${e.error}`)};return r}
if(SpeechRecognition){mic.onclick=()=>{if(listening){try{rec.abort()}catch(e){}listening=false;return}try{if(rec)rec.abort();input.value='';rec=createRecognition();rec.start()}catch(e){voiceState('error','Não foi possível iniciar o microfone.')}}}else{mic.disabled=true;mic.title='Reconhecimento de voz não suportado'}
if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});loadDevices().catch(()=>$('#status').textContent='OFFLINE');