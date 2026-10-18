(()=>{
 'use strict';
 const $=id=>document.getElementById(id),audio=$('japaAudio');if(!audio)return;
 const chants={
  radha:{title:'Radha Krishna naam japa',hi:'राधे कृष्ण। राधे कृष्ण। राधे कृष्ण। राधे कृष्ण।',roman:'Radhe Krishna. Radhe Krishna. Radhe Krishna. Radhe Krishna.',kind:'Traditional naam japa',note:'Devotional name repetition; not presented as a verbatim Bhagavad Gita verse.'},
  radhaNaam:{title:'Shrimati Radha Rani · Shri Radhe',hi:'श्री राधे। श्री राधे। राधे राधे।',roman:'Shri Radhe. Shri Radhe. Radhe Radhe.',kind:'Traditional naam japa',note:'A simple remembrance of Shrimati Radha Rani; not attributed to a particular scripture verse.'},
  govind:{title:'Shri Govinddevji Maharaj · Radha Govind',hi:'श्री राधा गोविन्द। श्री राधा गोविन्द। जय श्री गोविन्द देव जी।',roman:'Shri Radha Govind. Shri Radha Govind. Jai Shri Govind Dev Ji.',kind:'Traditional devotional invocation',note:'A personal naam-japa selection dedicated to Shri Govinddevji Maharaj; not a quotation from the Bhagavad Gita.'},
  vallabh:{title:'Shri Radhavallabh Lal Ji · Shri Radhe',hi:'जय श्री राधावल्लभ लाल। श्री राधे। श्री राधे।',roman:'Jai Shri Radhavallabh Lal. Shri Radhe. Shri Radhe.',kind:'Traditional devotional invocation',note:'A personal devotional invocation for Shri Radhavallabh Lal Ji; not a quotation from the Bhagavad Gita.'},
  hare:{title:'Hare Krishna maha mantra',hi:'हरे कृष्ण हरे कृष्ण, कृष्ण कृष्ण हरे हरे। हरे राम हरे राम, राम राम हरे हरे।',roman:'Hare Krishna Hare Krishna, Krishna Krishna Hare Hare. Hare Rama Hare Rama, Rama Rama Hare Hare.',kind:'Maha mantra · Gaudiya Krishna-first order',note:'This form is quoted in the commentary to Caitanya-caritamrita Adi 3.40, referring to the Kali-santarana Upanishad. It is not a Bhagavad Gita verse.',source:'https://vedabase.io/en/library/cc/adi/3/40/',reference:'Caitanya-caritamrita Adi 3.40 · commentary'},
  gita934:{title:'Bhagavad Gita 9.34 · Man-mana bhava',hi:'मन्मना भव मद्भक्तो मद्याजी मां नमस्कुरु। मामेवैष्यसि युक्त्वैवमात्मानं मत्परायणः॥',roman:'Man-mana bhava mad-bhakto mad-yaji mam namaskuru. Mam evaishyasi yuktvaivam atmanam mat-parayanah.',kind:'Scripture verse · Bhagavad Gita 9.34',note:'Sanskrit verse for recitation and reflection. Follow your own tradition or teacher for practice.',source:'https://www.holy-bhagavad-gita.org/chapter/9/verse/34/',reference:'Read Bhagavad Gita 9.34'},
  gita922:{title:'Bhagavad Gita 9.22 · Ananyas chintayanto',hi:'अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते। तेषां नित्याभियुक्तानां योगक्षेमं वहाम्यहम्॥',roman:'Ananyas chintayanto mam ye janah paryupasate. Tesham nityabhiyuktanam yoga-kshemam vahamy aham.',kind:'Scripture verse · Bhagavad Gita 9.22',note:'Sanskrit verse for devotional recitation and reflection.',source:'https://www.holy-bhagavad-gita.org/chapter/9/verse/22/',reference:'Read Bhagavad Gita 9.22'},
  bhagavatam:{title:'Srimad Bhagavatam 10.21.5 · Barhapidam',hi:'बर्हापीडं नटवरवपुः कर्णयोः कर्णिकारं बिभ्रद् वासः कनककपिशं वैजयन्तीं च मालाम्। रन्ध्रान् वेणोरधरसुधया पूरयन्गोपवृन्दैर्वृन्दारण्यं स्वपदरमणं प्राविशद् गीतकीर्तिः॥',roman:'Barhapidam nata-vara-vapuh karnayoh karnikaram, bibhrad vasah kanaka-kapisham vaijayantim cha malam. Randhran venor adhara-sudhaya purayan gopa-vrindair, vrindaranyam sva-pada-ramanam pravishad gita-kirtih.',kind:'Scripture verse · Srimad Bhagavatam 10.21.5',note:'A verse describing Shri Krishna entering Vrindavana with His flute and cowherd companions.',source:'https://vedabase.io/en/library/sb/10/21/5/',reference:'Read Srimad Bhagavatam 10.21.5'},
  brahma:{title:'Brahma-samhita 5.1 · Govinda',hi:'ईश्वरः परमः कृष्णः सच्चिदानन्दविग्रहः। अनादिरादिर्गोविन्दः सर्वकारणकारणम्॥',roman:'Ishvarah paramah krishnah sach-chid-ananda-vigrahah. Anadir adir govindah sarva-karana-karanam.',kind:'Scripture verse · Brahma-samhita 5.1',note:'A verse glorifying Shri Krishna as Govinda.',source:'https://vedabase.io/en/library/bs/5/1/',reference:'Read Brahma-samhita 5.1'},
  custom:{title:'My own naam japa or mantra',hi:'',roman:'',kind:'Your own text',note:'User-entered words. No scripture attribution is inferred.'}
 };
 const mantraSelect=$('japaMantra');mantraSelect.innerHTML='';for(const [key,chant] of Object.entries(chants)){const option=document.createElement('option');option.value=key;option.textContent=chant.title;mantraSelect.append(option)}
 const synth=window.speechSynthesis,Utterance=window.SpeechSynthesisUtterance;
 const speechAvailable=!!synth&&typeof Utterance==='function';
 let state='stopped',generation=0,repeatTimer=null,startTimer=null,utterance=null,fileUrl='',recordUrl='',voices=[],capture=null,savedRecordings=[];
 audio.loop=true;audio.autoplay=false;
 function message(text,error=false){$('japaStatus').textContent=text;$('japaStatus').classList.toggle('japa-error',error)}
 function controls(){const active=state==='starting'||state==='playing',busy=!!capture;$('japaPlay').disabled=active||busy;$('japaPlay').textContent=state==='paused'?'▶ Resume':'▶ Play continuously';$('japaPause').disabled=!active;$('japaStop').disabled=state==='stopped';$('japaVoice').disabled=active||busy;$('japaPace').disabled=active||busy;$('japaSource').disabled=busy;$('japaMantra').disabled=busy;$('japaRecord').disabled=busy;$('japaRecordStop').disabled=!busy||capture.stage==='saving';$('japaRecordStop').textContent=capture?.stage==='requesting'?'Cancel microphone request':'Stop recording';}
 function save(){try{localStorage.setItem('radar.japaPreferences',JSON.stringify({mantra:$('japaMantra').value,volume:Number($('japaVolume').value),pace:$('japaPace').value,custom:$('japaCustomText').value.slice(0,500)}))}catch{}}
 try{const p=JSON.parse(localStorage.getItem('radar.japaPreferences')||'{}');if(p&&typeof p.custom==='string')$('japaCustomText').value=p.custom.slice(0,500);if(p&&Object.hasOwn(chants,p.mantra))$('japaMantra').value=p.mantra;if(p&&Number.isFinite(p.volume)&&p.volume>=0&&p.volume<=100)$('japaVolume').value=String(p.volume);if(p&&['0.7','0.85','1'].includes(p.pace))$('japaPace').value=p.pace}catch{}
 function volume(){audio.volume=Number($('japaVolume').value)/100;$('japaVolumeValue').textContent=$('japaVolume').value+'%';save()}
 function selectedChant(){if($('japaMantra').value==='custom'){const text=$('japaCustomText').value.trim().slice(0,500);return {...chants.custom,hi:text,roman:text}}return Object.hasOwn(chants,$('japaMantra').value)?chants[$('japaMantra').value]:chants.radha}
 function verse(){const c=selectedChant();$('japaHindi').textContent=c.hi;$('japaRoman').textContent=c.roman;$('japaRoman').hidden=$('japaMantra').value==='custom';$('japaCustomPanel').hidden=$('japaMantra').value!=='custom';$('japaSourceKind').textContent=c.kind;$('japaSourceNote').textContent=c.note;const link=$('japaSourceLink');link.hidden=!c.source;if(c.source){link.href=c.source;link.textContent=c.reference}else link.removeAttribute('href')}
 function clearTimers(){if(repeatTimer!==null)clearTimeout(repeatTimer);if(startTimer!==null)clearTimeout(startTimer);repeatTimer=startTimer=null;}
 function interrupt(next='stopped'){
  ++generation;clearTimers();state=next;
  if(utterance&&synth){utterance.onend=utterance.onerror=utterance.onstart=null;synth.cancel();utterance=null;}
  audio.pause();$('japaVideoHost').querySelectorAll('audio,video').forEach(media=>media.pause());$('japaVideoHost').innerHTML='';$('japaOriginalVideo').hidden=true;controls();
 }
 function stop(){interrupt();try{audio.currentTime=0}catch{}message('Stopped. Press Play whenever you are ready.')}
 function pause(){if(!['playing','starting'].includes(state))return;interrupt('paused');message($('japaSource').value!=='voice'?'Paused. Press Resume to continue.':'Paused. Resume starts the mantra again.')}
 function fail(text){interrupt();message(text,true)}
 function loadVoices(){
  const chosen=$('japaVoice').value;try{voices=speechAvailable?synth.getVoices():[]}catch{voices=[]}
  $('japaVoice').innerHTML='';const auto=document.createElement('option');auto.value='';auto.textContent='Automatic · prefer Hindi';$('japaVoice').append(auto);
  voices.forEach((v,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=v.name+' · '+v.lang;$('japaVoice').append(o)});
  if(chosen!==''&&Number(chosen)<voices.length)$('japaVoice').value=chosen;
 }
 function speak(token){
  if(token!==generation||!['starting','playing'].includes(state))return;
  const c=selectedChant(),selected=$('japaVoice').value;
  const voice=selected!==''?voices[Number(selected)]:voices.find(v=>/^(hi|sa)(-|$)/i.test(v.lang))||voices.find(v=>v.default)||voices[0];
  const hindi=!voice||/^(hi|sa)(-|$)/i.test(voice.lang),u=new Utterance(hindi?c.hi:c.roman);utterance=u;
  if(voice)u.voice=voice;u.lang=voice?.lang||'hi-IN';u.rate=Number($('japaPace').value);u.volume=Number($('japaVolume').value)/100;
  u.onstart=()=>{if(token!==generation)return;if(startTimer!==null)clearTimeout(startTimer);startTimer=null;state='playing';controls();message('Playing spoken mantra · repeating continuously.')};
  u.onend=()=>{if(token!==generation)return;utterance=null;if(startTimer!==null)clearTimeout(startTimer);startTimer=null;repeatTimer=setTimeout(()=>speak(token),650)};
  u.onerror=()=>{if(token===generation)fail('The device voice could not play. Try another voice, or choose My audio recording.')};
  startTimer=setTimeout(()=>{if(token===generation)fail('The device voice did not start. Press Play to retry, or choose My audio recording.')},12000);
  try{synth.speak(u)}catch{fail('Spoken playback is unavailable. Choose My audio recording to play a chant on repeat.')}
 }
 async function play(){
  if(capture||$('japaSource').value==='saint'||['playing','starting'].includes(state))return;
  const source=$('japaSource').value;
  if(source==='file'&&!fileUrl){message('Choose an audio recording first, then press Play.',true);return}
  if(source==='record'&&!recordUrl){message('Record your chant first, then press Play continuously.',true);return}
  if(source==='voice'&&!selectedChant().hi){message('Enter the naam japa or mantra you want to repeat first.',true);return}
  if(source==='voice'&&!speechAvailable){message('This browser has no supported device voice. Choose My audio recording instead.',true);return}
  clearTimers();const token=++generation;state='starting';controls();message('Starting playback…');
  if(source==='voice'){loadVoices();speak(token);return}
  try{await audio.play();if(token!==generation)return;state='playing';controls();message('Playing your recording · continuous repeat is on.')}
  catch{if(token===generation)fail('Audio could not start. Press Play to retry. If it still fails, choose a supported MP3, WAV or M4A file.')}
 }
 $('japaPlay').addEventListener('click',play);$('japaPause').addEventListener('click',pause);$('japaStop').addEventListener('click',stop);
 $('japaVolume').addEventListener('input',volume);
 $('japaMantra').addEventListener('change',()=>{interrupt();verse();save();message($('japaSource').value==='record'?'Text selected for reading. Record this chant to hear it in your voice; an existing recording is unchanged.':'Mantra changed. Press Play to begin.')});
 $('japaPace').addEventListener('change',save);
 $('japaCustomText').addEventListener('input',()=>{interrupt();verse();save();message('Text updated. Record it in your voice or choose Built-in spoken mantra.')});
 document.querySelectorAll('[data-japa-favourite]').forEach(button=>button.addEventListener('click',()=>{if(capture)return;if(['saint','file'].includes($('japaSource').value)){$('japaSource').value='record';sourceView()}$('japaMantra').value=button.dataset.japaFavourite;$('japaMantra').dispatchEvent(new window.Event('change'))}));
 function sourceView(){discardCapture();interrupt();$('japaSaintChoice').value='';$('japaSaintSource').hidden=true;$('japaSaintDescription').textContent='Choose a published recording above, or paste your preferred recording below. Satsang options contain spoken teaching, not uninterrupted chanting.';const source=$('japaSource').value,file=source==='file',saint=source==='saint';$('japaFilePanel').hidden=!file;$('japaSaintPanel').hidden=!saint;$('japaRecordPanel').hidden=source!=='record';$('japaMantraLabel').hidden=file||saint;$('japaMantraTitle').textContent=source==='record'?'Mantra to read (optional)':'Choose mantra';$('japaVerse').hidden=file||saint;$('japaCustomPanel').hidden=saint||file||$('japaMantra').value!=='custom';$('japaSourceInfo').hidden=file||saint;$('japaPlaybackControls').hidden=saint;$('japaVoiceSettings').hidden=source!=='voice';const url=source==='record'?recordUrl:source==='file'?fileUrl:'';if(url&&audio.src!==url){audio.src=url;audio.load()}message(saint?'Paste a saint or temple YouTube recording, then load it.':source==='record'?(recordUrl?'Your voice recording is ready. Press Play continuously.':'Press Record my voice to begin.'):file?'Choose your recording, then press Play.':'Ready. Choose a mantra and press Play.')}
 $('japaSource').addEventListener('change',sourceView);
 $('japaFile').addEventListener('change',()=>{
  const file=$('japaFile').files?.[0];if(!file)return;
  if(file.size<=0||file.size>100*1024*1024||!(/^audio\//i.test(file.type)||/\.(mp3|m4a|wav|ogg|aac|flac|webm)$/i.test(file.name))){message('Choose a non-empty audio file up to 100 MB.',true);$('japaFile').value='';return}
  interrupt();if(fileUrl)URL.revokeObjectURL(fileUrl);fileUrl=URL.createObjectURL(file);audio.src=fileUrl;audio.loop=true;audio.load();$('japaFileName').textContent=file.name;message('Recording ready. Press Play for continuous repeat.');
 });
 function videoId(text){let u;try{u=new URL(text)}catch{throw Error('Paste a complete YouTube video link.')}if(u.protocol!=='https:'||u.username||u.password||u.port)throw Error('Use a public HTTPS YouTube video link.');let id='';if(u.hostname==='youtu.be')id=u.pathname.slice(1);else if(['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(u.hostname)){id=u.pathname==='/watch'?u.searchParams.get('v')||'':/^\/(embed|shorts|live)\/[^/]+\/?$/.test(u.pathname)?u.pathname.split('/')[2]:''}if(!/^[A-Za-z0-9_-]{11}$/.test(id))throw Error('Use a single YouTube video link, not a channel or playlist.');return id}
 function drawRecordings(){const select=$('japaSavedRecording');select.innerHTML='';const blank=document.createElement('option');blank.value='';blank.textContent='Choose a saved recording';select.append(blank);savedRecordings.forEach((r,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=r.title;select.append(o)})}
 try{const stored=JSON.parse(localStorage.getItem('radar.japaRecordings')||'[]');savedRecordings=Array.isArray(stored)?stored.filter(r=>r&&typeof r.id==='string'&&/^[A-Za-z0-9_-]{11}$/.test(r.id)&&typeof r.title==='string').slice(0,12).map(r=>({id:r.id,title:r.title.slice(0,100)})):[]}catch{}
 function loadRecording(){try{const id=videoId($('japaVideoUrl').value.trim()),title=$('japaRecordingTitle').value.trim().slice(0,100)||'My devotional recording';interrupt();const frame=document.createElement('iframe');frame.title=title+' · original recording';frame.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=0&controls=1&playsinline=1&loop=1&playlist='+id;frame.allow='encrypted-media; picture-in-picture; fullscreen';frame.referrerPolicy='strict-origin-when-cross-origin';frame.setAttribute('allowfullscreen','');$('japaVideoHost').append(frame);const link=$('japaOriginalVideo');link.href='https://www.youtube.com/watch?v='+id;link.hidden=false;message('Recording loaded. Press Play inside the video. Repeat is configured; playback depends on the recording provider.')}catch(error){message(error.message,true)}}
 const saintRecordings={
  premanand:{title:'Shri Premanand Maharaj · naam japa guidance',id:'0H8xTpzhx8M',source:'https://www.youtube.com/watch?v=0H8xTpzhx8M',note:'Bhajan Marg · spoken satsang about the pace of naam japa. This is not a continuous Radha chant.'},
  prabhupada:{title:'Srila Prabhupada · Hare Krishna group japa',audio:'https://harekrishnatemple.com/audio/prabhupada-group-japa.mp3',source:'https://harekrishnatemple.com/chapter7.html',note:'Hare Krishna Temple archive · Srila Prabhupada leading group japa (39:18). Original published recording; repeats after the full recording.'},
  ramesh:{title:'Shri Ramesh Baba Ji · Bhagwan Naam',id:'uY3XMvQSYX4',source:'https://www.youtube.com/watch?v=uY3XMvQSYX4',note:'Maan Mandir · Bhagwan Naam satsang by Shri Ramesh Baba Ji. Spoken teaching, not uninterrupted kirtan.'}
 };
 $('japaSaintChoice').addEventListener('change',()=>{
  interrupt();const key=$('japaSaintChoice').value,r=Object.hasOwn(saintRecordings,key)?saintRecordings[key]:null;
  $('japaSaintSource').hidden=!r;$('japaVideoUrl').value='';$('japaRecordingTitle').value='';
  $('japaSaintDescription').textContent=r?.note||'Paste your preferred YouTube recording below, then load it.';
  if(!r){message('Choose or paste your recording.');return}
  $('japaSaintSource').href=r.source;$('japaRecordingTitle').value=r.title;
  if(r.id){$('japaVideoUrl').value=r.source;loadRecording();return}
  const player=document.createElement('audio');player.controls=true;player.loop=true;player.autoplay=false;player.preload='none';player.src=r.audio;player.setAttribute('aria-label',r.title);player.style.width='100%';
  player.addEventListener('error',()=>message('This archive recording is unavailable. Open the recording source, or choose another recording.',true));
  player.addEventListener('playing',()=>message('Playing Srila Prabhupada group japa · repeat is on.'));
  player.addEventListener('pause',()=>{if(player.isConnected)message('Recording paused. Use its Play control to resume.')});
  $('japaVideoHost').append(player);message('Group japa ready. Press Play in the audio player. Repeat is on.');
 });
 $('japaLoadVideo').addEventListener('click',loadRecording);
 $('japaSaveVideo').addEventListener('click',()=>{try{const id=videoId($('japaVideoUrl').value.trim()),title=$('japaRecordingTitle').value.trim().slice(0,100)||'My devotional recording';if(savedRecordings.length>=12&&!savedRecordings.some(r=>r.id===id))throw Error('Your library has 12 recordings. Clear it before adding more.');const next=[{id,title},...savedRecordings.filter(r=>r.id!==id)];localStorage.setItem('radar.japaRecordings',JSON.stringify(next));savedRecordings=next;drawRecordings();message('Recording link saved in this browser.')}catch(error){message(error.message||'Browser storage is unavailable.',true)}});
 $('japaSavedRecording').addEventListener('change',()=>{const value=$('japaSavedRecording').value;if(value==='')return;const r=savedRecordings[Number(value)];if(!r)return;$('japaRecordingTitle').value=r.title;$('japaVideoUrl').value='https://www.youtube.com/watch?v='+r.id;loadRecording()});
 $('japaClearVideos').addEventListener('click',()=>{try{localStorage.removeItem('radar.japaRecordings');savedRecordings=[];drawRecordings();message('Saved recording links cleared.')}catch{message('Browser storage is unavailable.',true)}});
 drawRecordings();
 function releaseStream(stream){try{stream?.getTracks().forEach(track=>track.stop())}catch{}}
 function discardCapture(){const session=capture;if(!session)return;capture=null;session.discard=true;if(session.timer)clearTimeout(session.timer);try{if(session.recorder&&session.recorder.state!=='inactive')session.recorder.stop()}catch{}releaseStream(session.stream);controls();}
 function finishCapture(session){
  if(capture!==session||session.stage==='saving')return;
  session.stage='saving';if(session.timer)clearTimeout(session.timer);controls();
  try{if(session.recorder.state!=='inactive')session.recorder.stop();releaseStream(session.stream)}catch{discardCapture();message('Recording could not be saved. Try recording again.',true);$('japaRecordingStatus').textContent='Microphone off.';}
 }
 async function record(){
  if(capture)return;
  const media=typeof navigator!=='undefined'?navigator.mediaDevices:window.navigator?.mediaDevices,Recorder=typeof MediaRecorder==='function'?MediaRecorder:window.MediaRecorder;
  if(!media?.getUserMedia||typeof Recorder!=='function'){message('Recording is unavailable here. Open this page in a browser over HTTPS or localhost, or use My audio recording.',true);return}
  interrupt();const session={stage:'requesting',stream:null,recorder:null,chunks:[],size:0,timer:null,discard:false,error:''};capture=session;controls();message('Allow microphone access in your browser to begin.');$('japaRecordingStatus').textContent='Waiting for microphone permission…';
  try{
   const stream=await media.getUserMedia({audio:true,video:false});
   if(capture!==session||session.discard){releaseStream(stream);return}session.stream=stream;
   const mime=['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg;codecs=opus'].find(type=>Recorder.isTypeSupported?.(type));
   const recorder=new Recorder(stream,mime?{mimeType:mime}:undefined);session.recorder=recorder;
   recorder.ondataavailable=event=>{if(session.discard||!event.data?.size)return;session.size+=event.data.size;if(session.size>100*1024*1024){session.error='Recording exceeded 100 MB. Try a shorter chant.';finishCapture(session);return}session.chunks.push(event.data)};
   recorder.onerror=()=>{session.error='The microphone recording was interrupted. Please try again.';finishCapture(session)};
   recorder.onstop=()=>{
    releaseStream(stream);if(session.timer)clearTimeout(session.timer);if(capture!==session||session.discard)return;capture=null;controls();$('japaRecordingStatus').textContent='Microphone off.';
    if(session.error||!session.chunks.length){message(session.error||'No audio was captured. Record again and speak into your microphone.',true);return}
    const type=recorder.mimeType||session.chunks[0].type||'audio/webm',blob=new Blob(session.chunks,{type});
    if(!blob.size){message('No audio was captured. Please record again.',true);return}
    if(recordUrl)URL.revokeObjectURL(recordUrl);recordUrl=URL.createObjectURL(blob);audio.src=recordUrl;audio.loop=true;audio.load();
    const download=$('japaDownload');download.href=recordUrl;download.download='my-naam-japa.'+(type.includes('mp4')?'m4a':type.includes('ogg')?'ogg':'webm');download.hidden=false;
    message('Your recording is ready. Press Play continuously to repeat your own voice.');$('japaRecordingStatus').textContent='Microphone off · recording ready. Download a copy to keep it.';
   };
   recorder.start(1000);session.stage='recording';session.timer=setTimeout(()=>finishCapture(session),5*60*1000);controls();message('Recording your voice. Chant, then press Stop recording.');$('japaRecordingStatus').textContent='● Recording · microphone on · maximum 5 minutes.';
  }catch(error){releaseStream(session.stream);if(capture!==session)return;capture=null;controls();$('japaRecordingStatus').textContent='Microphone off.';message(error.name==='NotAllowedError'?'Microphone permission was denied. Allow it in your browser’s site settings, then press Record again.':error.name==='NotFoundError'?'No microphone was found. Connect one, or choose My audio recording.':'The microphone could not start. Check browser permission and whether another app is using it.',true)}
 }
 $('japaRecord').addEventListener('click',record);
 $('japaRecordStop').addEventListener('click',()=>{if(!capture)return;if(capture.stage==='requesting'){discardCapture();$('japaRecordingStatus').textContent='Microphone off.';message('Microphone request cancelled.')}else finishCapture(capture)});
 audio.addEventListener('error',()=>{if($('japaSource').value!=='voice')fail('This recording could not be decoded. Choose another audio file or record again.')});
 audio.addEventListener('waiting',()=>{if(state==='playing')message('Audio is buffering. Playback will continue when ready.')});
 audio.addEventListener('playing',()=>{if(!['starting','playing'].includes(state)||$('japaSource').value==='voice'){audio.pause();return}state='playing';controls();message('Playing your recording · continuous repeat is on.')});
 synth?.addEventListener?.('voiceschanged',loadVoices);
 window.addEventListener('pagehide',event=>{discardCapture();interrupt();if(!event.persisted){if(fileUrl)URL.revokeObjectURL(fileUrl);if(recordUrl)URL.revokeObjectURL(recordUrl)}});
 verse();volume();loadVoices();sourceView();
})();
