/* New project only. Anonymous identity is transparent; the host role is issued by a callable. */
(function(root){
 let pending=null,conn=null;
 const load=url=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=url;s.onload=resolve;s.onerror=()=>reject(Error('No se pudo cargar la conexión.'));document.head.append(s);});
 root.TegCloud={
  async connect(role='game'){
   if(conn)return conn;if(pending)return pending;
   pending=(async()=>{
    const cfg=root.TEG_FIREBASE;if(!cfg?.apiKey||!cfg?.appId)throw Error('Falta la configuración web de la-velada-equipos. Usá Ensayar sin conexión para probar el juego.');
    if(!root.firebase)await load('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
    for(const name of ['database','auth','functions'])if(!firebase[name])await load('https://www.gstatic.com/firebasejs/10.12.0/firebase-'+name+'-compat.js');
    const app=firebase.apps.find(a=>a.name==='teg-'+role)||firebase.initializeApp(cfg,'teg-'+role);
    const auth=app.auth();await auth.setPersistence(firebase.auth.Auth.Persistence.NONE);const user=(await auth.signInAnonymously()).user;
    const raw=app.database(),prefix=root.TEG_EVENT_ROOT;
    const db={ref:path=>raw.ref(path?.startsWith('.info/')?path:prefix+(path?'/'+path:''))};
    conn={app,auth,db,uid:user.uid};return conn;
   })();try{return await pending;}catch(e){pending=null;throw e;}
  },
  async login(password){const c=await this.connect('fixture');const call=c.app.functions('us-central1').httpsCallable('tegHostLogin');await call({password});await c.auth.currentUser.getIdToken(true);return c;}
 };
})(window);
