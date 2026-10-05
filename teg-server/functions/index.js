'use strict';
const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {defineSecret}=require('firebase-functions/params');
const {initializeApp}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getDatabase}=require('firebase-admin/database');
const {timingSafeEqual}=require('node:crypto');
initializeApp();
const password=defineSecret('TEG_HOST_PASSWORD');
exports.tegHostLogin=onCall({region:'us-central1',secrets:[password]},async req=>{
 if(!req.auth)throw new HttpsError('unauthenticated','No hay una sesión de participante.');
 const uid=req.auth.uid,ref=getDatabase().ref('tegAuthLimits/'+uid),now=Date.now();
 const limit=await ref.transaction(v=>{const old=v&&now-v.since<60000?v:{since:now,count:0};if(old.count>=5)return;return {since:old.since,count:old.count+1};});
 if(!limit.committed)throw new HttpsError('resource-exhausted','Esperá un minuto antes de volver a intentar.');
 const given=Buffer.from(String(req.data?.password||'')),expected=Buffer.from(password.value());
 if(given.length!==expected.length||!timingSafeEqual(given,expected))throw new HttpsError('permission-denied','Clave incorrecta.');
 const user=await getAuth().getUser(uid);await getAuth().setCustomUserClaims(uid,{...(user.customClaims||{}),tegConductor:true});
 return {ok:true};
});
