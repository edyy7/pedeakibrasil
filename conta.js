/* PedeAí · login Google + contas + período grátis + cobrança (compartilhado pelos apps) */
(function(){
const DIA=864e5,TRIAL=30,CAR=3,CRIADOR_EMAIL="edinaldooliveiradesouza@gmail.com";
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const R=v=>"R$ "+Number(v||0).toFixed(2).replace(".",",").replace(/\B(?=(\d{3})+,)/g,".");
const fmt=t=>new Date(t).toLocaleDateString("pt-BR");
const DEF={lojista:199.9,motoboy:0,adm:299.9,taxa:1};
const PLANOS={iniciante:{n:"Iniciante (comissionado)",p:0,d:30},mensal:{n:"Mensal",p:199.9,d:30},anual:{n:"Anual",p:1999,d:365},"3anos":{n:"3 anos",p:4799,d:1095},"5anos":{n:"5 anos",p:7199,d:1825}};
const ADMP={iniciante:{n:"Iniciante (0,5% no balcão)",p:0,d:30},mensal:{n:"Mensal",p:299.9,d:30}};
window.PA_PLANOS=PLANOS;window.PA_ADMP=ADMP;window.PA_esc=esc;window.PA_R=R;
const valorDe=(cfg,papel)=>{const v=cfg&&cfg.valores&&cfg.valores[papel];return typeof v==="number"?v:DEF[papel]};
const BTN="width:100%;padding:14px;border:0;border-radius:12px;font-size:16px;font-weight:700;margin-top:10px;cursor:pointer";
window.PA_BTN=BTN;window.PA_ov=ov;
function ov(html){const o=document.createElement("div");
 o.style.cssText="position:fixed;inset:0;z-index:99999;background:#0b0b0d;color:#f4f4f6;display:flex;padding:20px;font:16px system-ui,sans-serif;overflow:auto";
 o.innerHTML='<div style="max-width:380px;width:100%;margin:auto">'+html+'</div>';document.body.appendChild(o);return o}
const copia=t=>{try{navigator.clipboard.writeText(t).then(()=>window.PA_toast&&PA_toast("Copiado ✔"),()=>prompt("Copie:",t))}catch(e){prompt("Copie:",t)}};
window.PA_copia=copia;
window.PA_share=(u,t)=>{if(navigator.share)navigator.share({title:"PedeAí",text:t,url:u}).catch(()=>{});else copia(t+" "+u)};
window.PA_wa=(u,t)=>window.open("https://wa.me/?text="+encodeURIComponent(t+" "+u),"_blank");
window.PA_maps=q=>window.open("https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(q),"_blank");
const limpaCod=s=>String(s||"").toUpperCase().replace(/[^A-Z0-9-]/g,"").slice(0,30);
try{const q=limpaCod(new URLSearchParams(location.search).get("adm"));if(q)localStorage.setItem("pa_adm",q);const g=String(new URLSearchParams(location.search).get("gerente")||"").replace(/[^A-Za-z0-9]/g,"").slice(0,40);if(g)localStorage.setItem("pa_ger",g)}catch(e){}
const ALFA="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const rnd=n=>Array.from(crypto.getRandomValues(new Uint8Array(n)),x=>ALFA[x%ALFA.length]).join("");
window.PA_conviteLink=()=>PA.conta&&PA.conta.convite?location.origin+"/motoboy.html?convite="+encodeURIComponent(PA.conta.convite):null;
window.PA_novoConvite=()=>PA.novoConvite?PA.novoConvite():Promise.reject();
window.PA_link=()=>window.PA&&PA.loja?location.origin+"/cliente.html?loja="+encodeURIComponent(PA.loja.slug):null;

/* ---------- login ---------- */
window.PA_login=async function(H,au){
 await au.authStateReady();
 try{await H.getRedirectResult(au)}catch(e){console.error("redirect:",e)}
 if(window.PA_PAPEL==="cliente"){if(!au.currentUser)await H.signInAnonymously(au);return au.currentUser}
 if(au.currentUser&&!au.currentUser.isAnonymous)return au.currentUser;
 return new Promise(res=>{
  const o=ov('<div style="text-align:center"><div style="font-size:26px;font-weight:800;margin-bottom:6px">PedeAí Brasil</div><div style="color:#a3a3ad;margin-bottom:18px">Entre com sua conta Google.</div><button id="pa-g" style="'+BTN+';background:#fff;color:#222">Entrar com Google</button><div id="pa-ge" style="color:#ff6b6b;font-size:13px;margin-top:14px;min-height:18px"></div></div>');
  const btn=o.querySelector("#pa-g"),er=o.querySelector("#pa-ge");
  btn.onclick=async()=>{er.textContent="";btn.disabled=true;
   const p=new H.GoogleAuthProvider();p.setCustomParameters({prompt:"select_account"});
   try{const r=await H.signInWithPopup(au,p);o.remove();res(r.user)}
   catch(e){
    if(e.code==="auth/popup-blocked"||e.code==="auth/operation-not-supported-in-this-environment"){try{await H.signInWithRedirect(au,p);return}catch(e2){e=e2}}
    btn.disabled=false;
    er.textContent=e.code==="auth/popup-closed-by-user"||e.code==="auth/cancelled-popup-request"?"Login cancelado. Tente de novo.":e.code==="auth/unauthorized-domain"?"Domínio não autorizado no Firebase (Authentication → Domínios autorizados).":"Não foi possível entrar ("+(e.code||e.message)+").";
   }}})};

/* ---------- estado do plano ---------- */
const vencDe=d=>d.venc||((d.criadoEm&&d.criadoEm.toMillis?d.criadoEm.toMillis():Date.now())+TRIAL*DIA);
window.PA_estado=function(d,now){const v=vencDe(d),dias=Math.ceil((v-now)/DIA);
 if(now<=v)return dias>7?{k:"ativa",ico:"🟢",t:"Ativa · vence em "+dias+" dias",v,dias}:{k:"avencer",ico:"🟡",t:"A vencer · "+(dias<=0?"vence hoje":dias+" dia(s)"),v,dias};
 if(now<=v+CAR*DIA)return{k:"carencia",ico:"🟠",t:"Vencida · trava em "+Math.max(1,Math.ceil((v+CAR*DIA-now)/DIA))+" dia(s)",v,dias};
 return{k:"travada",ico:"🔴",t:"Travada por falta de pagamento",v,dias}};

/* ---------- conta ---------- */
window.PA_conta=async function(F,db,H,au){
 const papel=window.PA_PAPEL,u=au.currentUser;
 PA.fb={F,db,H,au};
 PA.logout=()=>H.signOut(au).then(()=>location.reload());
 if(papel==="cliente")return;
 let cfg={};try{const s=await F.getDoc(F.doc(db,"meta","config"));if(s.exists())cfg=s.data()}catch(e){}
 if(papel==="criador")return criador(F,db,u,cfg);
 const ref=F.doc(db,"contas",u.uid+"_"+papel);
 let s=await F.getDoc(ref);
 if(!s.exists())await F.setDoc(ref,{uid:u.uid,email:u.email||"",nome:u.displayName||"",papel,criadoEm:F.serverTimestamp(),visto:F.serverTimestamp()});
 else await F.setDoc(ref,{visto:F.serverTimestamp()},{merge:true});
 s=await F.getDoc(ref);let d=s.data();
 const off=(d.visto&&d.visto.toMillis?d.visto.toMillis():Date.now())-Date.now();
 const agora=()=>Date.now()+off;
 PA.conta=d;
 /* loja: o lojista cria a própria loja (nome + link para o cliente) */
 if(papel==="lojista"){
  if(!d.loja)d=await entrada(F,db,ref,u,d);else await papelNaLoja(F,db,u,d);
  if(PA.equipe){try{const ls=await F.getDoc(F.doc(db,"lojas",d.loja.slug));const dn=ls.exists()?ls.data().dono:null;if(dn)F.onSnapshot(F.doc(db,"contas",dn+"_lojista"),sn=>{if(sn.exists()){PA.donoConta=sn.data();window.PA_rr&&PA_rr()}},e=>console.error("dono:",e))}catch(e){console.error(e)}}
  PA.loja=d.loja;PA.conta=d;
  const gerar=async()=>{const slug=d.loja.slug,velho=d.convite;
   const code=(slug.replace(/[^a-z]/g,"").slice(0,2).toUpperCase()||"LJ")+"-"+rnd(6);
   await F.setDoc(F.doc(db,"convites",code),{slug,nome:d.loja.nome,dono:u.uid,criadoEm:Date.now()});
   await F.setDoc(ref,{convite:code},{merge:true});
   if(velho){try{await F.deleteDoc(F.doc(db,"convites",velho))}catch(e){}}
   d={...d,convite:code};PA.conta=d;return code};
  PA.novoConvite=gerar;
  if(!d.convite&&!PA.equipe){try{await gerar()}catch(e){console.error("convite:",e)}}
  /* loja suspensa pelo ADM: tela de bloqueio (a regra do servidor também recusa pedido novo) */
  let sp=null;
  F.onSnapshot(F.doc(db,"lojas",d.loja.slug),sn=>{const s=sn.exists()&&sn.data().suspensa===true;const pn=sn.exists()&&sn.data().plano||"iniciante";if(pn!==PA.plano){PA.plano=pn;window.PA_rr&&PA_rr()}
   if(s&&!sp){sp=ov('<div style="text-align:center"><div style="font-size:42px">⛔</div><div style="font-size:22px;font-weight:800;margin:6px 0">Loja suspensa</div><div style="color:#a3a3ad;margin-bottom:14px">Sua loja foi suspensa pela administração. Fale com o seu ADM para voltar a vender.</div><button data-a="sair" style="'+BTN+';background:#2a2a31;color:#f4f4f6">Sair da conta</button></div>');sp.onclick=ev=>{if(ev.target.dataset&&ev.target.dataset.a==="sair")PA.logout()}}
   else if(!s&&sp){sp.remove();sp=null}},e=>console.error("suspensa:",e));
 }
 if(papel==="adm"){
  if(!d.admCodigo){try{d=await criaCodigoAdm(F,db,ref,u,d)}catch(e){console.error("admCodigo:",e)}}
  PA.admCodigo=d.admCodigo||null;PA.conta=d;PA.plano=d.plano||"iniciante";
 }
 if(papel==="motoboy"&&!d.aceite){await aceite(F,ref,d);d=(await F.getDoc(ref)).data();PA.conta=d}
 let pw=null,bar=null;
 const render=()=>{
  const gratis=valorDe(cfg,papel)===0;
  if(papel==="motoboy")PA.vinculo=d.loja||null;
  const e=gratis?{k:"ativa",ico:"🟢",t:"Plano gratuito",v:agora()+3650*DIA,dias:3650}:PA_estado(PA.equipe&&PA.donoConta?PA.donoConta:d,agora());PA.estado=e;PA.travada=e.k==="travada";
  if(!bar){bar=document.createElement("div");bar.style.cssText="background:#16161a;color:#f4f4f6;font:12.5px system-ui,sans-serif;padding:6px 10px;display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center";
   const st=document.getElementById("pa-st");if(st&&st.parentNode)st.parentNode.insertBefore(bar,st.nextSibling);else document.body.prepend(bar)}
  const b=(id,t)=>'<button data-a="'+id+'" style="background:#2a2a31;color:#f4f4f6;border:0;border-radius:8px;padding:5px 9px;font-size:12px;font-weight:700;cursor:pointer">'+t+'</button>';
  bar.innerHTML='<span>'+e.ico+' '+esc(e.t)+(gratis?'':' · até '+fmt(e.v))+'</span><span style="flex:1"></span>'+(PA_link()?b("link","🔗 Link da loja"):"")+(papel==="adm"?b("rh","👥 RH"+(PA.rhN?" ("+PA.rhN+")":"")):"")+(papel==="lojista"&&!PA.equipe?b("eq","👥 Equipe"):"")+(gratis||PA.equipe?"":b("pagar","💳 Pagar"))+b("sair","Sair");
  bar.onclick=ev=>{const a=ev.target.dataset&&ev.target.dataset.a;if(a==="link")PA_copia(PA_link());else if(a==="pagar")paywall(false);else if(a==="rh")PA_RH.adm();else if(a==="eq")PA_RH.equipe();else if(a==="sair")PA.logout()};
  if(window.PA_onConta)try{window.PA_onConta({estado:e,loja:PA.loja,venc:e.v})}catch(x){console.error(x)}
  if(e.k==="travada")paywall(true);else if(pw){pw.remove();pw=null}
 };
 function paywall(bloqueio){
  if(pw)pw.remove();
  if(PA.equipe){if(pw)pw.remove();pw=ov('<div style="text-align:center"><div style="font-size:42px">🔒</div><div style="font-size:22px;font-weight:800;margin:6px 0">Loja bloqueada</div><div style="color:#a3a3ad;margin-bottom:14px">A conta da loja venceu. Avise o gerente para regularizar o pagamento.</div><button data-a="sair" style="'+BTN+';background:#2a2a31;color:#f4f4f6">Sair da conta</button></div>');pw.onclick=ev=>{if(ev.target.dataset&&ev.target.dataset.a==="sair")PA.logout()};return}
  const p=d.pagto||{},tab=papel==="adm"?ADMP:PLANOS,pl=tab[PA.planoSel]?PA.planoSel:(tab[PA.plano]?PA.plano:"iniciante"),valor=pl==="iniciante"?(PA.fat==null?0:PA.fat):tab[pl].p;
  const emAnalise=p.st==="analise";
  pw=ov('<div style="text-align:center"><div style="font-size:42px">'+(bloqueio?"🔒":"💳")+'</div><div style="font-size:22px;font-weight:800;margin:6px 0">'+(bloqueio?"Seu período acabou":"Pagar mensalidade")+'</div>'
   +'<div style="color:#a3a3ad;margin-bottom:10px">'+(bloqueio?"Para continuar usando, pague. ":"")+'O pagamento libera mais '+tab[pl].d+' dias (+3 de carência).</div>'
   +'<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">'+Object.keys(tab).map(k=>'<button data-a="pl:'+k+'" style="flex:1;min-width:46%;padding:8px;border-radius:10px;border:2px solid '+(k===pl?'#22a559':'#2a2a31')+';background:#16161a;color:#f4f4f6;font-size:12px;font-weight:700;cursor:pointer">'+esc(tab[k].n)+(tab[k].p?'<br>'+R(tab[k].p):'')+'</button>').join('')+'</div>'
   +'<div style="background:#16161a;border-radius:12px;padding:14px;text-align:left"><div style="color:#a3a3ad;font-size:13px">'+(pl==="iniciante"?(PA.fat==null?"Calculando fatura…":"Fatura congelada (pedidos até ontem — D-1)"):"Valor do plano")+'</div><b style="font-size:22px">'+R(valor)+'</b>'
   +(cfg.pix?'<div style="color:#a3a3ad;font-size:13px;margin-top:10px">Chave Pix'+(cfg.titular?' · '+esc(cfg.titular):'')+'</div><b style="word-break:break-all">'+esc(cfg.pix)+'</b><button data-a="cp" style="'+BTN+';background:#2a2a31;color:#f4f4f6;margin-top:8px;padding:10px">📋 Copiar chave Pix</button>':'<div style="color:#e0a800;margin-top:10px">A chave Pix ainda não foi configurada pelo Criador. Fale com o suporte.</div>')+'</div>'
   +(emAnalise?'<div style="color:#e0a800;margin-top:14px;font-weight:700">⏳ Pagamento informado em '+fmt(p.em)+'. Aguardando confirmação.</div>':p.st==="recusado"?'<div style="color:#ff6b6b;margin-top:14px">Último pagamento não foi confirmado. Confira e informe de novo.</div>':'')
   +(emAnalise?'':'<button data-a="pago" style="'+BTN+';background:#22a559;color:#fff">✅ Já paguei</button>')
   +(cfg.whats?'<button data-a="wa" style="'+BTN+';background:#2a2a31;color:#f4f4f6">💬 Falar com o suporte</button>':'')
   +(bloqueio?'':'<button data-a="x" style="'+BTN+';background:transparent;color:#a3a3ad">Fechar</button>')
   +'<button data-a="sair" style="'+BTN+';background:transparent;color:#a3a3ad">Sair da conta</button></div>');
  pw.onclick=async ev=>{const a=ev.target.dataset&&ev.target.dataset.a;if(!a)return;
   if(a.indexOf("pl:")===0){PA.planoSel=a.slice(3);paywall(bloqueio);return}if(a==="cp")copia(cfg.pix);else if(a==="sair")PA.logout();else if(a==="x"){pw.remove();pw=null}
   else if(a==="wa")window.open("https://wa.me/"+String(cfg.whats).replace(/\D/g,"")+"?text="+encodeURIComponent("Olá! Paguei a mensalidade do PedeAí ("+(u.email||"")+")"),"_blank");
   else if(a==="pago"){ev.target.disabled=true;try{await F.setDoc(ref,{pagto:{st:"analise",em:Date.now(),valor,plano:pl}},{merge:true})}catch(e){ev.target.disabled=false;alert("Não foi possível registrar. Tente de novo.")}}};
 }
 window.PA_pagar=()=>paywall(false);
 PA_rr=window.PA_rr=()=>render();
 const calcFat=async()=>{try{PA.fat=await congelado(F,db,papel,d);render()}catch(e){console.error("fatura:",e)}};
 render();if(papel==="adm"||(papel==="lojista"&&!PA.equipe)){calcFat();setInterval(calcFat,300000)}
 if(papel==="adm")PA_RH.watchAdm();
 F.onSnapshot(ref,sn=>{if(!sn.exists())return;d=sn.data();PA.conta=d;render()});
 setInterval(render,60000);
};

/* ---------- fatura congelada D-1: só pedidos até ontem (hoje vai para o próximo ciclo) ---------- */
const hoje0=()=>{const t=new Date();t.setHours(0,0,0,0);return t.getTime()};
const okSt=p=>!/^cancel/.test(p.st||"")&&p.st!=="descartado";
async function congelado(F,db,papel,d){
 const fim=hoje0(),ini=vencDe(d)-TRIAL*DIA,dentro=p=>(p.criadoEm||0)>=ini&&(p.criadoEm||0)<fim&&okSt(p);
 const pedidos=async slug=>{const s=await F.getDocs(F.query(F.collection(PA.fb.db,"pedidos"),F.where("loja","==",slug)));return s.docs.map(x=>x.data()).filter(dentro)};
 if(papel==="lojista"){if(!d.loja)return 0;return Math.round((await pedidos(d.loja.slug)).filter(p=>p.cli!=="Avulso").reduce((t,p)=>t+(p.ts||0),0)*100)/100}
 if(papel==="adm"){if((d.plano||"iniciante")!=="iniciante")return 0;
  const ls=await F.getDocs(F.query(F.collection(PA.fb.db,"lojas"),F.where("admId","==",d.uid)));let t=0;
  for(const l of ls.docs){if((l.data().plano||"iniciante")!=="iniciante")continue;t+=(await pedidos(l.id)).filter(p=>p.cli==="Avulso").reduce((a,p)=>a+(p.v||0),0)*0.005}
  return Math.round(t*100)/100}
 return 0}
window.PA_fatura={congelado,hoje0};

/* ---------- entrada do lojista: link do ADM (gerente) ou equipe; a loja é criada pelo ADM ---------- */
async function entrada(F,db,ref,u,d){
 const email=String(u.email||"").toLowerCase();
 for(;;){
  const tok=(()=>{try{return localStorage.getItem("pa_ger")||""}catch(e){return ""}})();
  if(tok){try{const cr=F.doc(db,"gerenteConvites",tok),cs=await F.getDoc(cr);
    if(cs.exists()){const c=cs.data();
     if(!c.usado){await F.setDoc(cr,{usado:true,uid:u.uid,em:Date.now()},{merge:true});await F.setDoc(F.doc(db,"lojas",c.slug),{dono:u.uid,pendente:false,gerenteToken:tok},{merge:true})}
     else if(c.uid!==u.uid)throw new Error("usado");
     else{try{await F.setDoc(F.doc(db,"lojas",c.slug),{dono:u.uid,pendente:false,gerenteToken:tok},{merge:true})}catch(e){/* já era sua */}}
     await F.setDoc(ref,{loja:{nome:c.nome,slug:c.slug}},{merge:true});try{localStorage.removeItem("pa_ger")}catch(e){}
     return {...d,loja:{nome:c.nome,slug:c.slug}}}
    try{localStorage.removeItem("pa_ger")}catch(e){}}
   catch(e){console.error("gerente:",e);try{localStorage.removeItem("pa_ger")}catch(x){}
    await espera('<div style="font-size:42px">⚠️</div><div style="font-size:21px;font-weight:800;margin:6px 0">Link de convite inválido ou já usado</div><div style="color:#a3a3ad">Peça ao seu ADM um novo link.</div>');continue}}
  let eq=null;try{const s=await F.getDocs(F.query(F.collection(db,"equipe"),F.where("email","==",email)));s.forEach(x=>{if(!eq||x.data().st==="ativo")eq={id:x.id,...x.data()}})}catch(e){console.error("equipe:",e)}
  if(eq&&eq.st==="ativo"){PA.equipe=eq;try{const l=await F.getDoc(F.doc(db,"lojas",eq.slug));await F.setDoc(ref,{loja:{nome:l.exists()?l.data().nome:eq.slug,slug:eq.slug}},{merge:true});return {...d,loja:{nome:l.exists()?l.data().nome:eq.slug,slug:eq.slug}}}catch(e){console.error(e)}}
  if(eq){/* sala de espera: o ADM autoriza e escolhe o cargo */
   await new Promise(res=>{const o=ov('<div style="text-align:center"><div style="font-size:42px">⏳</div><div style="font-size:22px;font-weight:800;margin:6px 0">Aguardando autorização</div><div style="color:#a3a3ad;margin-bottom:14px">O ADM da loja precisa autorizar seu acesso e definir o seu cargo. Esta tela libera sozinha.</div><button data-a="sair" style="'+BTN+';background:#2a2a31;color:#f4f4f6">Sair da conta</button></div>');
    o.onclick=ev=>{if(ev.target.dataset&&ev.target.dataset.a==="sair")PA.logout()};
    F.onSnapshot(F.doc(db,"equipe",eq.id),sn=>{if(sn.exists()&&sn.data().st==="ativo"){o.remove();res()}})});continue}
  await espera('<div style="font-size:42px">🏪</div><div style="font-size:21px;font-weight:800;margin:6px 0">Acesso só por convite</div><div style="color:#a3a3ad">A loja é criada pelo seu ADM. Abra o link de convite que ele enviou. Se você é funcionário, peça ao gerente para cadastrar o seu e-mail ('+esc(email)+').</div>')}}
function espera(h){return new Promise(()=>{const o=ov('<div style="text-align:center">'+h+'<button data-a="sair" style="'+BTN+';background:#2a2a31;color:#f4f4f6">Sair da conta</button></div>');o.onclick=ev=>{if(ev.target.dataset&&ev.target.dataset.a==="sair")PA.logout()}})}
async function papelNaLoja(F,db,u,d){
 let l=null;try{const s=await F.getDoc(F.doc(db,"lojas",d.loja.slug));l=s.exists()?s.data():null}catch(e){console.error(e)}
 if(!l||!l.dono||l.dono===u.uid)return;
 const email=String(u.email||"").toLowerCase();let eq=null;
 try{const s=await F.getDocs(F.query(F.collection(db,"equipe"),F.where("email","==",email)));s.forEach(x=>{if(x.data().slug===d.loja.slug&&x.data().st==="ativo")eq={id:x.id,...x.data()}})}catch(e){console.error(e)}
 if(eq){PA.equipe=eq;return}
 await espera('<div style="font-size:42px">🚫</div><div style="font-size:21px;font-weight:800;margin:6px 0">Acesso à loja removido</div><div style="color:#a3a3ad">O seu acesso a esta loja não está ativo. Fale com o gerente ou com o ADM.</div>')}
/* ---------- entregador: aceite do plano grátis ---------- */
function aceite(F,ref,d){return new Promise(res=>{const o=ov('<div style="text-align:center"><div style="font-size:40px">🛵</div><div style="font-size:22px;font-weight:800;margin:6px 0">Plano Grátis do Entregador</div><div style="color:#a3a3ad;text-align:left;margin-bottom:14px">Sem mensalidade. Você só vê as corridas da loja à qual se vincular pelo código de convite.</div><label style="display:flex;gap:8px;text-align:left;align-items:flex-start"><input id="pa-ac" type="checkbox" style="width:22px;height:22px"> <span>Li e aceito o Plano Grátis.</span></label><button id="pa-ab" style="'+BTN+';background:#22a559;color:#fff">Aceitar e entrar</button></div>');
 o.querySelector("#pa-ab").onclick=async()=>{if(!o.querySelector("#pa-ac").checked){alert("Marque o aceite para continuar.");return}try{await F.setDoc(ref,{aceite:{em:Date.now(),plano:"gratis"}},{merge:true});o.remove();res()}catch(e){alert("Não foi possível registrar o aceite.")}}})}

async function criaCodigoAdm(F,db,ref,u,d){
 const nm=(u.displayName||u.email||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().split(/[^A-Z]+/).filter(Boolean)[0]||"";
 const base="ADM-"+(nm.slice(0,10)||rnd(5));
 for(let i=0;i<5;i++){
  const code=i?base+"-"+rnd(3):base;
  try{
   await F.setDoc(F.doc(db,"admCodigos",code),{uid:u.uid,nome:u.displayName||"",criadoEm:F.serverTimestamp()});
   await F.setDoc(ref,{admCodigo:code},{merge:true});
   return {...d,admCodigo:code};
  }catch(e){if(e.code!=="permission-denied")throw e}
 }
 throw new Error("sem código disponível")}

async function novaLoja(F,db,ref,u,d){
 return new Promise(res=>{
  const pre=(()=>{try{return localStorage.getItem("pa_adm")||""}catch(e){return ""}})();
  const IN="width:100%;box-sizing:border-box;padding:14px;border-radius:12px;border:1px solid #2a2a31;background:#16161a;color:#f4f4f6;font-size:16px";
  const o=ov('<div style="text-align:center"><div style="font-size:24px;font-weight:800;margin-bottom:6px">Qual o nome da sua loja?</div><div style="color:#a3a3ad;margin-bottom:14px">Seus clientes verão este nome no link de pedidos.</div><input id="pa-ln" maxlength="40" placeholder="Ex.: Lanchonete do Zé" style="'+IN+'">'
   +'<div style="text-align:left;color:#a3a3ad;font-size:14px;margin:14px 0 4px">Tem um código de ADM? (opcional)</div><input id="pa-lc" maxlength="30" autocapitalize="characters" placeholder="Ex.: ADM-EDINALDO" value="'+esc(pre)+'" style="'+IN+';text-transform:uppercase">'
   +'<div style="text-align:left;color:#a3a3ad;font-size:12.5px;margin-top:4px">Se não tiver, deixe em branco: sua loja fica com a administração padrão.</div>'
   +'<button id="pa-lb" style="'+BTN+';background:#22a559;color:#fff">Criar minha loja</button><div id="pa-le" style="color:#ff6b6b;font-size:13px;margin-top:10px;min-height:18px"></div></div>');
  const inp=o.querySelector("#pa-ln"),cod=o.querySelector("#pa-lc"),btn=o.querySelector("#pa-lb"),er=o.querySelector("#pa-le");
  btn.onclick=async()=>{const nome=inp.value.trim(),code=limpaCod(cod.value);if(nome.length<2){er.textContent="Digite o nome da loja.";return}
   btn.disabled=true;er.textContent="";
   try{
    /* confere o código do ADM antes de criar (não deixa a loja cair no ADM errado por erro de digitação) */
    let admId="padrao";
    if(code){
     let a=null;try{a=await F.getDoc(F.doc(db,"admCodigos",code))}catch(e){console.error(e)}
     if(!a||!a.exists()){btn.disabled=false;er.textContent="Código de ADM não encontrado. Confira, ou apague o campo para seguir sem código.";return}
     admId=a.data().uid}
    const slug=(nome.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,30)||"loja")+"-"+u.uid.slice(0,5).toLowerCase();
    const dados={nome,dono:u.uid,criadoEm:Date.now(),admId};if(code)dados.admCodigo=code;
    await F.setDoc(F.doc(db,"lojas",slug),dados,{merge:true});
    await F.setDoc(ref,{loja:{nome,slug}},{merge:true});
    try{localStorage.removeItem("pa_adm")}catch(e){}
    o.remove();res({...d,loja:{nome,slug}})
   }catch(e){console.error(e);btn.disabled=false;er.textContent="Não foi possível criar. Tente de novo."}}})}

/* ---------- Criador: assume o sistema, confirma pagamentos, define Pix ---------- */
async function criador(F,db,u,cfg){
 if(String(u.email||"").toLowerCase()!==CRIADOR_EMAIL){
  const o=ov('<div style="text-align:center"><div style="font-size:40px">🔒</div><div style="font-size:20px;font-weight:800">Acesso negado</div><div style="color:#a3a3ad;margin-top:6px">Esta área é exclusiva do Criador do sistema.</div><button style="'+BTN+';background:#2a2a31;color:#f4f4f6">Sair</button></div>');
  o.onclick=()=>PA.logout();return}
 const bt=document.createElement("button");bt.textContent="💳 Contas e pagamentos";
 bt.style.cssText="position:fixed;right:12px;bottom:12px;z-index:9999;background:#22a559;color:#fff;border:0;border-radius:24px;padding:12px 16px;font:700 14px system-ui;box-shadow:0 4px 14px #0008;cursor:pointer";
 bt.onclick=()=>painel(F,db,cfg);document.body.appendChild(bt)}

async function painel(F,db,cfg){
 const o=ov('<div id="pc">Carregando…</div>');o.firstChild.style.maxWidth="440px";
 const draw=async()=>{
  const snap=await F.getDocs(F.collection(db,"contas")),now=Date.now(),L=[];snap.forEach(x=>L.push({id:x.id,...x.data()}));
  L.sort((a,b)=>((b.pagto&&b.pagto.st==="analise")?1:0)-((a.pagto&&a.pagto.st==="analise")?1:0));
  const c=cfg;
  o.firstChild.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:20px">💳 Contas e pagamentos</b><button data-a="x" style="background:#2a2a31;color:#f4f4f6;border:0;border-radius:8px;padding:8px 12px;font-weight:700">Fechar</button></div>'
   +'<div style="background:#16161a;border-radius:12px;padding:12px;margin:12px 0"><b>Taxa de serviço do cliente (Iniciante, R$)</b><input id="cts" type="number" step="0.01" min="0" value="'+esc(typeof c.taxaServico==="number"?c.taxaServico:DEF.taxa)+'" style="width:100%;box-sizing:border-box;margin:6px 0 12px;padding:10px;border-radius:8px;border:1px solid #2a2a31;background:#0b0b0d;color:#f4f4f6"><b>Cobrança (R$ por mês · 0 = grátis)</b><div style="color:#a3a3ad;font-size:13px;margin-top:8px">Loja</div><input id="cvl" type="number" step="0.01" min="0" value="'+esc(valorDe(c,'lojista'))+'" style="width:100%;box-sizing:border-box;margin-top:4px;padding:10px;border-radius:8px;border:1px solid #2a2a31;background:#0b0b0d;color:#fff"><div style="color:#a3a3ad;font-size:13px;margin-top:8px">Entregador</div><input id="cvm" type="number" step="0.01" min="0" value="'+esc(valorDe(c,'motoboy'))+'" style="width:100%;box-sizing:border-box;margin-top:4px;padding:10px;border-radius:8px;border:1px solid #2a2a31;background:#0b0b0d;color:#fff"><div style="color:#a3a3ad;font-size:13px;margin-top:8px">ADM</div><input id="cva" type="number" step="0.01" min="0" value="'+esc(valorDe(c,'adm'))+'" style="width:100%;box-sizing:border-box;margin-top:4px;padding:10px;border-radius:8px;border:1px solid #2a2a31;background:#0b0b0d;color:#fff">'+'<input id="cp" value="'+esc(c.pix||"")+'" placeholder="Chave Pix" style="width:100%;box-sizing:border-box;margin-top:8px;padding:10px;border-radius:8px;border:1px solid #2a2a31;background:#0b0b0d;color:#fff"><input id="ct" value="'+esc(c.titular||"")+'" placeholder="Nome do titular" style="width:100%;box-sizing:border-box;margin-top:8px;padding:10px;border-radius:8px;border:1px solid #2a2a31;background:#0b0b0d;color:#fff"><input id="cw" value="'+esc(c.whats||"")+'" placeholder="WhatsApp do suporte (só números)" style="width:100%;box-sizing:border-box;margin-top:8px;padding:10px;border-radius:8px;border:1px solid #2a2a31;background:#0b0b0d;color:#fff"><button data-a="cfg" style="'+BTN+';background:#22a559;color:#fff;padding:10px">Salvar cobrança</button></div>'
   +(L.length?L.map(x=>{const e=PA_estado(x,now),an=x.pagto&&x.pagto.st==="analise";
    return '<div style="background:#16161a;border-radius:12px;padding:12px;margin-bottom:10px;'+(an?'border:2px solid #e0a800':'')+'"><b>'+esc(x.nome||x.email)+'</b> <span style="color:#a3a3ad">· '+esc(x.papel)+(x.loja?' · '+esc(x.loja.nome):'')+'</span><div style="color:#a3a3ad;font-size:13px">'+esc(x.email)+'</div><div style="margin-top:4px">'+e.ico+' '+esc(e.t)+' · até '+fmt(e.v)+'</div>'
     +(an?'<div style="color:#e0a800;font-weight:700;margin-top:4px">⏳ Informou pagamento de '+R(x.pagto.valor)+' em '+fmt(x.pagto.em)+'</div><button data-a="ok" data-id="'+esc(x.id)+'" style="'+BTN+';background:#22a559;color:#fff;padding:10px">✅ Confirmar (libera o plano)</button><button data-a="no" data-id="'+esc(x.id)+'" style="'+BTN+';background:#2a2a31;color:#f4f4f6;padding:10px">Não recebi</button>':'<button data-a="mais" data-id="'+esc(x.id)+'" style="'+BTN+';background:#2a2a31;color:#f4f4f6;padding:8px;font-size:14px">+30 dias manual</button>')+'</div>'}).join(""):'<div style="color:#a3a3ad">Nenhuma conta cadastrada ainda.</div>');
  o.firstChild.onclick=async ev=>{const a=ev.target.dataset&&ev.target.dataset.a;if(!a)return;
   const id=ev.target.dataset.id,x=L.find(y=>y.id===id);
   try{
    if(a==="x"){o.remove();return}
    if(a==="cfg"){const nv=(id,p)=>{const x=parseFloat(String(o.querySelector(id).value).replace(",","."));return isFinite(x)&&x>=0?Math.round(x*100)/100:DEF[p]};const v={valores:{lojista:nv("#cvl","lojista"),motoboy:nv("#cvm","motoboy"),adm:nv("#cva","adm")},pix:o.querySelector("#cp").value.trim(),titular:o.querySelector("#ct").value.trim(),whats:o.querySelector("#cw").value.trim(),taxaServico:nv("#cts","taxa")};await F.setDoc(F.doc(db,"meta","config"),v);Object.assign(cfg,v);window.PA_toast&&PA_toast("Cobrança salva ✔");return}
    if(a==="ok"||a==="mais"){const base=Math.max(Date.now(),vencDe(x));await F.setDoc(F.doc(db,"contas",id),{venc:base+((x.papel==="adm"?ADMP:PLANOS)[(x.pagto&&x.pagto.plano)||"iniciante"]||{d:30}).d*DIA,plano:(x.pagto&&x.pagto.plano)||x.plano||"iniciante",pagto:{st:"ok",em:Date.now()},admAlt:0,vencBase:F.deleteField()},{merge:true});
     if(x.papel==="lojista"&&x.loja&&x.pagto&&x.pagto.plano)await F.setDoc(F.doc(db,"lojas",x.loja.slug),{plano:x.pagto.plano},{merge:true})}
    if(a==="no")await F.setDoc(F.doc(db,"contas",id),{pagto:{st:"recusado",em:Date.now()}},{merge:true});
    await draw()}catch(e){console.error(e);alert("Erro: "+(e.code||e.message))}};
 };
 try{await draw()}catch(e){o.firstChild.innerHTML='<div style="color:#ff6b6b">Erro ao carregar ('+esc(e.code||e.message)+')</div><button style="'+BTN+'" onclick="this.closest(\'div[style*=fixed]\').remove()">Fechar</button>'}
}
})();
