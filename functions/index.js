'use strict';
const {onRequest}=require('firebase-functions/v2/https');
const admin=require('firebase-admin');
const bcrypt=require('bcryptjs');
admin.initializeApp();
const db=admin.firestore();
const ORIGIN='https://ik-robin.github.io';
const region='asia-southeast1';
const options={region,cors:[ORIGIN],maxInstances:10};
const validAlias=a=>typeof a==='string'&&/^[A-Za-z0-9_-]{1,60}$/.test(a);
const validURL=u=>{try{return typeof u==='string'&&u.length<=4096&&['https:','http:'].includes(new URL(u).protocol)}catch{return false}};
const reply=(res,status,data)=>res.status(status).json(data);
const err=(e,res)=>{console.error(e);return reply(res,500,{error:'Request failed. Try again later.'})};
const post=(handler)=>onRequest(options,async(req,res)=>{res.set('Cache-Control','no-store');if(req.method!=='POST')return reply(res,405,{error:'POST required'});try{await handler(req,res)}catch(e){err(e,res)}});
async function user(req){const h=req.get('authorization')||'';if(!h.startsWith('Bearer '))throw Object.assign(new Error('Sign in required'),{status:401});const t=await admin.auth().verifyIdToken(h.slice(7));if(t.firebase.sign_in_provider!=='google.com')throw Object.assign(new Error('Google sign-in required'),{status:403});return t}
async function owner(req,alias){const u=await user(req);const ref=db.collection('links').doc(alias);const snap=await ref.get();if(!snap.exists||snap.data().ownerUid!==u.uid)throw Object.assign(new Error('Link not found or not owned by you'),{status:403});return {ref,snap,u}}
function checkInput(b){if(!validAlias(b.alias)||!validURL(b.url)||typeof b.title!=='string'||b.title.length>100)throw Object.assign(new Error('Invalid alias, URL or title'),{status:400});if(b.password&&(typeof b.password!=='string'||b.password.length<8||b.password.length>128))throw Object.assign(new Error('Password must be 8–128 characters'),{status:400});if(b.expiresAt&&(!Number.isFinite(Date.parse(b.expiresAt))||Date.parse(b.expiresAt)<=Date.now()))throw Object.assign(new Error('Expiration must be in the future'),{status:400})}
function handle(e,res){if(e.status)return reply(res,e.status,{error:e.message});if(e.code===6||e.code==='already-exists')return reply(res,409,{error:'Alias already taken'});return err(e,res)}
exports.createLink=post(async(req,res)=>{try{const u=await user(req),b=req.body||{};checkInput(b);const hash=b.password?await bcrypt.hash(b.password,12):null;await db.collection('links').doc(b.alias).create({url:b.url,title:b.title,ownerUid:u.uid,enabled:b.enabled!==false,expiresAt:b.expiresAt?admin.firestore.Timestamp.fromDate(new Date(b.expiresAt)):null,passwordHash:hash,clicks:0,createdAt:admin.firestore.FieldValue.serverTimestamp()});reply(res,200,{ok:true})}catch(e){handle(e,res)}});
exports.updateLink=post(async(req,res)=>{try{const b=req.body||{};if(!validAlias(b.alias))return reply(res,400,{error:'Invalid alias'});checkInput(b);const {ref}=await owner(req,b.alias);const updates={url:b.url,title:b.title,enabled:b.enabled!==false,expiresAt:b.expiresAt?admin.firestore.Timestamp.fromDate(new Date(b.expiresAt)):null,updatedAt:admin.firestore.FieldValue.serverTimestamp()};if(b.removePassword===true)updates.passwordHash=null;else if(b.password)updates.passwordHash=await bcrypt.hash(b.password,12);await ref.update(updates);reply(res,200,{ok:true})}catch(e){handle(e,res)}});
exports.deleteLink=post(async(req,res)=>{try{const alias=req.body?.alias;if(!validAlias(alias))return reply(res,400,{error:'Invalid alias'});const {ref}=await owner(req,alias);await db.recursiveDelete(ref);reply(res,200,{ok:true})}catch(e){handle(e,res)}});
const problem=l=>l.enabled===false?'Link disabled':(l.expiresAt&&l.expiresAt.toMillis()<=Date.now())?'Link expired':!validURL(l.url)?'Invalid destination':null;
function device(ua){return /ipad|tablet/i.test(ua)?'Tablet':/mobile|android|iphone/i.test(ua)?'Mobile':'Desktop'}
exports.resolveLink=post(async(req,res)=>{const b=req.body||{},alias=b.alias;if(!validAlias(alias))return reply(res,400,{error:'Invalid alias'});const ref=db.collection('links').doc(alias);const snap=await ref.get();if(!snap.exists)return reply(res,404,{error:'Link not found'});const l=snap.data(),p=problem(l);if(p)return reply(res,410,{error:p});if(l.passwordHash){if(!b.password)return reply(res,200,{passwordRequired:true});if(typeof b.password!=='string'||b.password.length>128)return reply(res,400,{error:'Invalid password'});if(!await bcrypt.compare(b.password,l.passwordHash))return reply(res,403,{error:'Incorrect password'})}
// Counts are recorded before redirect. Public requests can inflate counts; production needs rate limiting.
const day=new Date().toISOString().slice(0,10),daily=ref.collection('daily').doc(day),d=device(req.get('user-agent')||'');
try{await db.runTransaction(async tx=>{const [ls,ds]=await Promise.all([tx.get(ref),tx.get(daily)]);if(!ls.exists||problem(ls.data()))throw new Error('Link unavailable');const previous=ds.exists?ds.data():{},devices={...(previous.devices||{})};devices[d]=(devices[d]||0)+1;tx.update(ref,{clicks:admin.firestore.FieldValue.increment(1)});tx.set(daily,{date:day,clicks:(previous.clicks||0)+1,devices,countries:{Unknown:(previous.countries?.Unknown||0)+1}})})}catch(e){return err(e,res)}
reply(res,200,{destination:l.url})});
