(() => {
 const copy=JSON.parse(document.getElementById('help-data').textContent);
 const get=id=>document.getElementById(id);
 let running=false,textMode=matchMedia('(prefers-reduced-motion: reduce)').matches,phase=false,timer=null,step=0;
 const sections=['home','breath','focus','finished'];
 function stop(){running=false;clearInterval(timer);timer=null;phase=false;get('circle').classList.remove('running');get('circle').dataset.phase='idle';get('breath-label').textContent='sesuai ritmemu';get('start').textContent='Mulai panduan';get('text-instruction').textContent='Tarik dan hembuskan napas lembut, tanpa menahan napas. Tempo boleh diabaikan.';}
 function show(name){stop();sections.forEach(s=>get(s).hidden=s!==name);if(name==='focus'){step=0;renderStep();}get(name).querySelector('h1,h2')?.focus();}
 function renderStep(){get('step-title').textContent=copy.steps[step].title;get('step-body').textContent=copy.steps[step].text;get('step-count').textContent='Langkah '+(step+1)+' / '+copy.steps.length;}
 function next(){if(step<copy.steps.length-1){step++;renderStep();get('step-title').focus();}else show('finished');}
 document.querySelectorAll('[data-guide]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.guide)));
 get('start').onclick=()=>{if(running){stop();return;}running=true;phase=false;get('circle').dataset.phase='inhale';get('start').textContent='Hentikan panduan';get('breath-label').textContent='tarik napas';get('text-instruction').textContent='Tarik napas lembut.';if(!textMode)get('circle').classList.add('running');timer=setInterval(()=>{phase=!phase;get('circle').dataset.phase=phase?'exhale':'inhale';get('breath-label').textContent=phase?'hembuskan':'tarik napas';get('text-instruction').textContent=phase?'Hembuskan lembut.':'Tarik napas lembut.';},4000);};
 const mode=()=>{get('circle').hidden=textMode;get('text-panel').hidden=!textMode;get('text-mode').textContent=textMode?'Gunakan animasi':'Mode teks';};
 get('text-mode').onclick=()=>{stop();textMode=!textMode;mode();};mode();
 get('next').onclick=next;get('skip').onclick=next;get('finish').onclick=()=>show('finished');
 get('breath-copy').textContent=copy.breath;get('discomfort').textContent=copy.discomfort;
 get('medical-copy').textContent=copy.medical;get('medical-action').textContent=copy.medicalAction;get('professional-copy').textContent=copy.professional;
 show(location.pathname.includes('/napas')?'breath':location.pathname.includes('/fokus')?'focus':'home');
})();
