(()=>{
 'use strict';
 const $=id=>document.getElementById(id),audio=$('japaAudio');if(!audio)return;
 const chants={
  radha:{hi:'राधे कृष्ण। राधे कृष्ण। राधे कृष्ण। राधे कृष्ण।',roman:'Radhe Krishna. Radhe Krishna. Radhe Krishna. Radhe Krishna.'},
  hare:{hi:'हरे कृष्ण हरे कृष्ण, कृष्ण कृष्ण हरे हरे। हरे राम हरे राम, राम राम हरे हरे।',roman:'Hare Krishna Hare Krishna, Krishna Krishna Hare Hare. Hare Rama Hare Rama, Rama Rama Hare Hare.'}
 };
 const synth=window.speechSynthesis,Utterance=window.SpeechSynthesisUtterance;
 const speechAvailable=!!synth&&typeof Utterance==='function';
 let state='stopped',generation=0,repeatTimer=null,startTimer=null,utterance=null,fileUrl='',recordUrl='',voices=[],capture=null;
 audio.loop=true;audio.autoplay=false;
 function message(text,error=false){$('japaStatus').textContent=text;$('japaStatus').classList.toggle('japa-error',error)}
 function controls(){const active=state==='starting'||state==='playing',busy=!!capture;$('japaPlay').disabled=active||busy;$('japaPlay').textContent=state==='paused'?'▶ Resume':'▶ Play continuously';$('japaPause').disabled=!active;$('japaStop').disabled=state==='stopped';$('japaVoice').disabled=active||busy;$('japaPace').disabled=active||busy;$('japaSource').disabled=busy;$('japaMantra').disabled=busy;$('japaRecord').disabled=busy;$('japaRecordStop').disabled=!busy||capture.stage==='saving';$('japaRecordStop').textContent=capture?.stage==='requesting'?'Cancel microphone request':'Stop recording';}
 function save(){try{localStorage.setItem('radar.japaPreferences',JSON.stringify({mantra:$('japaMantra').value,volume:Number($('japaVolume').value),pace:$('japaPace').value}))}catch{}}
 try{const p=JSON.parse(localStorage.getItem('radar.japaPreferences')||'{}');if(p&&chants[p.mantra])$('japaMantra').value=p.mantra;if(p&&Number.isFinite(p.volume)&&p.volume>=0&&p.volume<=100)$('japaVolume').value=String(p.volume);if(p&&['0.7','0.85','1'].includes(p.pace))$('japaPace').value=p.pace}catch{}
 function volume(){audio.volume=Number($('japaVolume').value)/100;$('japaVolumeValue').textContent=$('japaVolume').value+'%';save()}
 function verse(){const c=chants[$('japaMantra').value]||chants.radha;$('japaHindi').textContent=c.hi;$('japaRoman').textContent=c.roman}
 function clearTimers(){if(repeatTimer!==null)clearTimeout(repeatTimer);if(startTimer!==null)clearTimeout(startTimer);repeatTimer=startTimer=null;}
 function interrupt(next='stopped'){
  ++generation;clearTimers();state=next;
  if(utterance&&synth){utterance.onend=utterance.onerror=utterance.onstart=null;synth.cancel();utterance=null;}
  audio.pause();controls();
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
  const c=chants[$('japaMantra').value]||chants.radha,selected=$('japaVoice').value;
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
  if(capture||['playing','starting'].includes(state))return;
  const source=$('japaSource').value;
  if(source==='file'&&!fileUrl){message('Choose an audio recording first, then press Play.',true);return}
  if(source==='record'&&!recordUrl){message('Record your chant first, then press Play continuously.',true);return}
  if(source==='voice'&&!speechAvailable){message('This browser has no supported device voice. Choose My audio recording instead.',true);return}
  clearTimers();const token=++generation;state='starting';controls();message('Starting playback…');
  if(source==='voice'){loadVoices();speak(token);return}
  try{await audio.play();if(token!==generation)return;state='playing';controls();message('Playing your recording · continuous repeat is on.')}
  catch{if(token===generation)fail('Audio could not start. Press Play to retry. If it still fails, choose a supported MP3, WAV or M4A file.')}
 }
 $('japaPlay').addEventListener('click',play);$('japaPause').addEventListener('click',pause);$('japaStop').addEventListener('click',stop);
 $('japaVolume').addEventListener('input',volume);
 $('japaMantra').addEventListener('change',()=>{interrupt();verse();save();message('Mantra changed. Press Play to begin.')});
 $('japaPace').addEventListener('change',save);
 function sourceView(){discardCapture();interrupt();const source=$('japaSource').value,file=source==='file';$('japaFilePanel').hidden=!file;$('japaRecordPanel').hidden=source!=='record';$('japaMantraLabel').hidden=file;$('japaMantraTitle').textContent=source==='record'?'Mantra to read (optional)':'Choose mantra';$('japaVerse').hidden=file;$('japaVoiceSettings').hidden=source!=='voice';const url=source==='record'?recordUrl:source==='file'?fileUrl:'';if(url&&audio.src!==url){audio.src=url;audio.load()}message(source==='record'?(recordUrl?'Your voice recording is ready. Press Play continuously.':'Press Record my voice to begin.'):file?'Choose your recording, then press Play.':'Ready. Choose a mantra and press Play.')}
 $('japaSource').addEventListener('change',sourceView);
 $('japaFile').addEventListener('change',()=>{
  const file=$('japaFile').files?.[0];if(!file)return;
  if(file.size<=0||file.size>100*1024*1024||!(/^audio\//i.test(file.type)||/\.(mp3|m4a|wav|ogg|aac|flac|webm)$/i.test(file.name))){message('Choose a non-empty audio file up to 100 MB.',true);$('japaFile').value='';return}
  interrupt();if(fileUrl)URL.revokeObjectURL(fileUrl);fileUrl=URL.createObjectURL(file);audio.src=fileUrl;audio.loop=true;audio.load();$('japaFileName').textContent=file.name;message('Recording ready. Press Play for continuous repeat.');
 });
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
