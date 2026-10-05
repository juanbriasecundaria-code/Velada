/* TEG uses guessmovie-905e2. Anonymous identity is transparent; the host password is checked locally for this private event. */
(function(root){
 let pending=null,conn=null;
 const load=url=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=url;s.onload=resolve;s.onerror=()=>reject(Error('No se pudo cargar la conexión.'));document.head.append(s);});
 root.TegCloud={
  async connect(role='game'){
   if(conn)return conn;if(pending)return pending;
   pending=(async()=>{
    const cfg=root.TEG_FIREBASE;if(!cfg?.apiKey||!cfg?.appId)throw Error('Falta la configuración web de guessmovie-905e2. Usá Ensayar sin conexión para probar el juego.');
    if(!root.firebase)await load('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
    for(const name of ['database','auth'])if(!firebase[name])await load('https://www.gstatic.com/firebasejs/10.12.0/firebase-'+name+'-compat.js');
    const app=firebase.apps.find(a=>a.name==='teg-'+role)||firebase.initializeApp(cfg,'teg-'+role);
    const auth=app.auth();await auth.setPersistence(firebase.auth.Auth.Persistence.NONE);const user=(await auth.signInAnonymously()).user;
    const raw=app.database(),prefix=root.TEG_EVENT_ROOT;
    const db={ref:path=>raw.ref(path?.startsWith('.info/')?path:prefix+(path?'/'+path:''))};
    conn={app,auth,db,uid:user.uid};return conn;
   })();try{return await pending;}catch(e){pending=null;throw e;}
  },
  async login(password){if(String(password).trim()!=='100')throw Error('Clave incorrecta.');return this.connect('fixture');}
 };
})(window);
