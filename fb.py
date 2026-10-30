APP_JS="export const initializeApp=c=>({c});"
FS_JS=r"""
const S=o=>JSON.stringify(o);
const user=()=>{try{return JSON.parse(localStorage.getItem('fake_user')||'null')}catch(e){return null}};
const authInfo=()=>{const u=user();return u?{uid:u.uid,email:u.email||null,email_verified:!!u.email_verified}:null};
const rpc=async b=>{const r=await fetch('/__op',{method:'POST',body:S({...b,auth:authInfo()})});const j=await r.json();if(j.err){const e=new Error('permission-denied');e.code='permission-denied';throw e}return j};
const wrap=v=>{if(Array.isArray(v))return v.map(wrap);if(v&&typeof v==='object'){if(v.__ts!==undefined){const m=v.__ts;return {toMillis:()=>m,toDate:()=>new Date(m),seconds:Math.floor(m/1000),__ts:m}}const o={};for(const k in v)o[k]=wrap(v[k]);return o}return v};
const enc=v=>{if(v&&v.__sentinel)return v.s;if(Array.isArray(v))return v.map(enc);if(v&&typeof v==='object'){if(v.toMillis&&v.__ts!==undefined)return {__ts:v.__ts};const o={};for(const k in v)if(v[k]!==undefined)o[k]=enc(v[k]);return o}return v};
export const getFirestore=()=>({});export const serverTimestamp=()=>({__sentinel:1,s:{__ts:1}});export const deleteField=()=>({__sentinel:1,s:{__del:1}});
export const doc=(db,...p)=>({kind:'doc',path:p.join('/'),id:p[p.length-1]});
export const collection=(db,...p)=>({kind:'col',col:p.join('/')});
export const where=(f,o,v)=>{if(o!=='==')throw new Error('op '+o);return [f,o,v]};
export const query=(c,...w)=>({kind:'q',col:c.col,where:w.filter(Array.isArray)});
const dsnap=(path,d)=>({id:path.split('/').pop(),exists:()=>d!==null&&d!==undefined,data:()=>d?wrap(d):undefined});
const qsnap=r=>{const docs=r.docs.map(x=>({id:x.id,exists:()=>true,data:()=>wrap(x.data)}));return {docs,size:docs.length,empty:!docs.length,forEach:f=>docs.forEach(f)}};
export const getDoc=async r=>dsnap(r.path,(await rpc({op:'get',path:r.path})).data);
export const getDocs=async q=>qsnap(await rpc({op:'query',col:q.col,where:q.where}));
export const setDoc=(r,d,o)=>rpc({op:'write',writes:[{kind:'set',path:r.path,data:enc(d),merge:!!(o&&o.merge)}]});
export const deleteDoc=r=>rpc({op:'write',writes:[{kind:'delete',path:r.path}]});
export const onSnapshot=(r,cb,eb)=>{let last=null,dead=false;const tick=async()=>{if(dead)return;try{const s=r.kind==='doc'?dsnap(r.path,(await rpc({op:'get',path:r.path})).data):qsnap(await rpc({op:'query',col:r.col,where:r.where}));const k=S(r.kind==='doc'?(s.data()||null):s.docs.map(x=>[x.id,x.data()]));if(k!==last){last=k;cb(s)}}catch(e){if(last!=='ERR'){last='ERR';eb&&eb(e)}}if(!dead)setTimeout(tick,150)};tick();return()=>{dead=true}};
export const runTransaction=async(db,fn)=>{const w=[];const t={get:r=>getDoc(r),set:(r,d,o)=>w.push({kind:'set',path:r.path,data:enc(d),merge:!!(o&&o.merge)}),update:(r,d)=>w.push({kind:'set',path:r.path,data:enc(d),merge:true})};const v=await fn(t);if(w.length)await rpc({op:'write',writes:w});return v};
"""
AUTH_JS=r"""
const gu=()=>{try{return JSON.parse(localStorage.getItem('fake_user')||'null')}catch(e){return null}};
export class GoogleAuthProvider{setCustomParameters(){}}
export const getAuth=()=>({authStateReady:async()=>{},get currentUser(){return gu()}});
export const getRedirectResult=async()=>null;
export const signInWithPopup=async()=>{const u={...window.__NEXT_USER,isAnonymous:false};localStorage.setItem('fake_user',JSON.stringify(u));return {user:u}};
export const signInWithRedirect=async()=>{throw Object.assign(new Error('x'),{code:'auth/x'})};
export const signInAnonymously=async()=>{const u={uid:'anon-'+Math.random().toString(36).slice(2,9),isAnonymous:true,email:null};localStorage.setItem('fake_user',JSON.stringify(u));return {user:u}};
export const signOut=async()=>{localStorage.removeItem('fake_user')};
"""
