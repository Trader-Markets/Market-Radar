(()=>{
 'use strict';
 const $=id=>document.getElementById(id),audio=$('japaAudio');if(!audio)return;
 const chants={
  radha:{hi:'राधे कृष्ण। राधे कृष्ण। राधे कृष्ण। राधे कृष्ण।',roman:'Radhe Krishna. Radhe Krishna. Radhe Krishna. Radhe Krishna.'},
  hare:{hi:'हरे कृष्ण हरे कृष्ण, कृष्ण कृष्ण हरे हरे। हरे राम हरे राम, राम राम हरे हरे।',roman:'Hare Krishna Hare Krishna, Krishna Krishna Hare Hare. Hare Rama Hare Rama, Rama Rama Hare Hare.'}
 };
 const synth=window.speechSynthesis,Utterance=window.SpeechSynthesisUtterance;
 const speechAvailable=!!synth&&typeof Utterance==='function';
 let state='stopped',generation=0,repeatTimer=null,startTimer=null,utterance=null,fileUrl='',voices=[];
 audio.loop=true;audio.autoplay=false;
 function message(text,error=false){$('japaStatus').textContent=text;$('japaStatus').classList.toggle('japa-error',error)}
 function controls(){const active=state==='starting'||state==='playing';$('japaPlay').disabled=active;$('japaPlay').textContent=state==='paused'?'▶ Resume':'▶ Play continuously';$('japaPause').disabled=!active;$('japaStop').disabled=state==='stopped';$('japaVoice').disabled=active;$('japaPace').disabled=active;}
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
 function pause(){if(!['playing','starting'].includes(state))return;interrupt('paused');message($('japaSource').value==='file'?'Paused. Press Resume to continue.':'Paused. Resume starts the mantra again.')}
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
  if(['playing','starting'].includes(state))return;
  const source=$('japaSource').value;
  if(source==='file'&&!fileUrl){message('Choose an audio recording first, then press Play.',true);return}
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
 $('japaSource').addEventListener('change',()=>{interrupt();const file=$('japaSource').value==='file';$('japaFilePanel').hidden=!file;$('japaMantraLabel').hidden=file;$('japaVerse').hidden=file;$('japaVoiceSettings').hidden=file;message(file?'Choose your recording, then press Play.':'Ready. Choose a mantra and press Play.')});
 $('japaFile').addEventListener('change',()=>{
  const file=$('japaFile').files?.[0];if(!file)return;
  if(file.size<=0||file.size>100*1024*1024||!(/^audio\//i.test(file.type)||/\.(mp3|m4a|wav|ogg|aac|flac|webm)$/i.test(file.name))){message('Choose a non-empty audio file up to 100 MB.',true);$('japaFile').value='';return}
  interrupt();if(fileUrl)URL.revokeObjectURL(fileUrl);fileUrl=URL.createObjectURL(file);audio.src=fileUrl;audio.loop=true;audio.load();$('japaFileName').textContent=file.name;message('Recording ready. Press Play for continuous repeat.');
 });
 audio.addEventListener('error',()=>{if(fileUrl&&$('japaSource').value==='file')fail('This recording could not be decoded. Choose another audio file.')});
 audio.addEventListener('waiting',()=>{if(state==='playing')message('Audio is buffering. Playback will continue when ready.')});
 audio.addEventListener('playing',()=>{if(!['starting','playing'].includes(state)||$('japaSource').value!=='file'){audio.pause();return}if(['starting','playing'].includes(state)&&$('japaSource').value==='file'){state='playing';controls();message('Playing your recording · continuous repeat is on.')}});
 synth?.addEventListener?.('voiceschanged',loadVoices);
 window.addEventListener('pagehide',()=>{interrupt();if(fileUrl)URL.revokeObjectURL(fileUrl)});
 verse();volume();loadVoices();controls();
 if(!speechAvailable)message('Device speech is unavailable in this browser. Choose My audio recording for continuous playback.');
})();
