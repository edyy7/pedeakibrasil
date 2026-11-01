/* PedeAí Brasil · Diárias (v6.0.0) — módulo compartilhado (lojista e motoboy).
   Vagas controladas no SERVIDOR: o aceite é uma transação e o firestore.rules recusa o aceite
   quando as vagas acabaram, quando a diária foi cancelada ou depois do horário fim. */
(function(){
const DIA_MIN_MOTIVO=3;
const pad=n=>String(n).padStart(2,"0");
const ms=(d,h)=>new Date(d+"T"+h+":00").getTime();
function janela(d,i,f){const a=ms(d,i);let b=ms(d,f);if(!(b>a))b+=86400000;return {iniMs:a,fimMs:b}}
const br=d=>String(d||"").split("-").reverse().join("/");
function valida(x){
 if(!x||!/^\d{4}-\d{2}-\d{2}$/.test(x.d||""))return "Informe a data";
 if(!/^\d{2}:\d{2}$/.test(x.i||""))return "Informe a hora de início";
 if(!/^\d{2}:\d{2}$/.test(x.f||""))return "Informe a hora de fim";
 if(!(Number(x.v)>=0)||String(x.v).trim()==="")return "Informe o valor (pode ser 0)";
 const q=parseInt(x.q,10);if(!(q>=1&&q<=20))return "Vagas: de 1 a 20";
 return "";
}
/* Estado mostrado nas telas. Encerramento automático = calculado pelo horário fim. */
function estado(d,agora){
 agora=agora||Date.now();
 if(d.st==="cancelada")return {k:"cancelada",t:"Cancelada pela loja"+(d.durante?" (durante o turno)":"")};
 if(agora>=(d.fimMs||0))return {k:"encerrada",t:"Encerrada"};
 const n=(d.ens||[]).length;
 if(n>=d.q)return {k:"cheia",t:"Vagas preenchidas"};
 return {k:"aberta",t:"Aberta"};
}
const vagasRest=d=>Math.max(0,(d.q||0)-(d.ens||[]).length);
function watch(fb,slug,cb,eb){
 const {F,db}=fb;
 return F.onSnapshot(F.query(F.collection(db,"diarias"),F.where("loja","==",slug)),s=>{
  const l=s.docs.map(x=>({id:x.id,...x.data()}));
  l.sort((a,b)=>(a.iniMs||0)-(b.iniMs||0));cb(l)},eb||(e=>console.error("diarias:",e)));
}
async function criar(fb,slug,x,lojaN){
 const er=valida(x);if(er)throw {code:"invalido",message:er};
 const {F,db}=fb,j=janela(x.d,x.i,x.f),id="d"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
 await F.setDoc(F.doc(db,"diarias",id),{loja:slug,lojaN:lojaN||"",d:x.d,i:x.i,f:x.f,v:Number(x.v),q:parseInt(x.q,10),o:String(x.o||"").slice(0,200),
  st:"aberta",ens:[],ensN:[],iniMs:j.iniMs,fimMs:j.fimMs,criadoEm:Date.now(),atualizadoEm:Date.now()});
 return id;
}
async function editar(fb,id,x){
 const er=valida(x);if(er)throw {code:"invalido",message:er};
 const {F,db}=fb,j=janela(x.d,x.i,x.f);
 await F.setDoc(F.doc(db,"diarias",id),{d:x.d,i:x.i,f:x.f,v:Number(x.v),q:parseInt(x.q,10),o:String(x.o||"").slice(0,200),iniMs:j.iniMs,fimMs:j.fimMs,atualizadoEm:Date.now()},{merge:true});
}
async function cancelar(fb,d,motivo){
 motivo=String(motivo||"").trim();
 if(motivo.length<DIA_MIN_MOTIVO)throw {code:"sem-motivo",message:"Informe o motivo do cancelamento"};
 const {F,db}=fb,agora=Date.now();
 await F.setDoc(F.doc(db,"diarias",d.id),{st:"cancelada",motivo:motivo.slice(0,200),canceladaEm:agora,durante:agora>=(d.iniMs||0),atualizadoEm:agora},{merge:true});
 if((d.ens||[]).length&&window.PA&&PA.user){try{const t=await PA.user.getIdToken();
  fetch("/api/push",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+t},body:JSON.stringify({diaria:d.id}),keepalive:true}).catch(()=>{})}catch(e){}}
}
/* Aceite por transação. Devolve {ok:true} ou {ok:false,motivo:"esgotada"|"cancelada"|"encerrada"|"ja"|"erro"}. */
async function aceitar(fb,id,me){
 const {F,db}=fb;
 try{
  await F.runTransaction(db,async t=>{
   const r=F.doc(db,"diarias",id),s=await t.get(r);
   if(!s.exists())throw {code:"nao-existe"};
   const d=s.data();
   if(d.st==="cancelada")throw {code:"cancelada"};
   if(Date.now()>=(d.fimMs||0))throw {code:"encerrada"};
   const ens=(d.ens||[]).slice(),ensN=(d.ensN||[]).slice();
   if(ens.includes(me.uid))throw {code:"ja"};
   if(ens.length>=d.q)throw {code:"esgotada"};
   ens.push(me.uid);ensN.push(me.nome||"Entregador");
   t.update(r,{ens,ensN,atualizadoEm:Date.now()});
  });
  return {ok:true};
 }catch(e){
  const c=e&&e.code;
  if(c==="esgotada"||c==="cancelada"||c==="encerrada"||c==="ja")return {ok:false,motivo:c};
  /* Recusa do servidor (corrida na última vaga): relê para dizer o motivo certo. */
  try{const s=await F.getDoc(F.doc(db,"diarias",id)),d=s.exists()?s.data():null;
   if(d){if((d.ens||[]).includes(me.uid))return {ok:true};
    if(d.st==="cancelada")return {ok:false,motivo:"cancelada"};
    if(Date.now()>=(d.fimMs||0))return {ok:false,motivo:"encerrada"};
    if((d.ens||[]).length>=d.q)return {ok:false,motivo:"esgotada"}}}catch(e2){}
  console.error("aceitar diária:",e);return {ok:false,motivo:"erro"};
 }
}
const MSG={esgotada:"Vaga preenchida: outro entregador foi mais rápido.",cancelada:"Esta diária foi cancelada pela loja.",encerrada:"Esta diária já encerrou.",ja:"Você já aceitou esta diária.",erro:"Não foi possível aceitar agora. Tente de novo."};
window.PADia={valida,estado,vagasRest,watch,criar,editar,cancelar,aceitar,br,janela,MSG,MIN_MOTIVO:DIA_MIN_MOTIVO};
})();
