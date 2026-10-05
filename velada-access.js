/* Same shared code as the original. This is a screen lock, not server authentication. */
(function(){'use strict';const key='velada-v3:conductor-pin';let pending;
const valid=code=>String(code??'').trim()==='100';
const unlocked=()=>{try{return sessionStorage.getItem(key)==='unlocked'}catch{return false}};
const remember=()=>{try{sessionStorage.setItem(key,'unlocked')}catch{}};
function request(onAccept){if(pending)return pending;pending=new Promise(resolve=>{
 const e=document.createElement('div');e.id='v-access';e.className='v-access';e.setAttribute('role','dialog');e.setAttribute('aria-modal','true');e.setAttribute('aria-labelledby','v-access-title');
 e.innerHTML='<form class="v-access-box"><div class="v-access-icon">🔒</div><h2 id="v-access-title">Acceso del conductor</h2><p>Ingresá la contraseña para continuar</p><input name="code" type="password" inputmode="numeric" autocomplete="off" placeholder="•••" maxlength="10" aria-label="Contraseña" required><p class="v-access-error" role="alert"></p><button class="v-btn primary" type="submit">Ingresar</button><a href="index.html">Volver a los juegos</a></form>';
 document.body.append(e);const input=e.querySelector('input'),form=e.querySelector('form'),error=e.querySelector('.v-access-error');
 form.addEventListener('submit',async event=>{event.preventDefault();if(!valid(input.value)){error.textContent='Contraseña incorrecta, intentá de nuevo.';input.select();return}const button=form.querySelector('button');button.disabled=true;try{await onAccept(input.value);e.remove();pending=null;resolve()}catch(err){error.textContent=err.message;input.select()}finally{button.disabled=false}});
 e.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const nodes=[...e.querySelectorAll('input,button,a')],first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}});input.focus();
 });return pending;}
 window.VeladaAccess={valid,unlocked,remember,request};
})();
