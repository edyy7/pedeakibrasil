/* PedeAí v5.0 · RH e equipe: ADM cria lojas/cargos/aprova; Gerente cadastra e-mails; folha em PDF */
(function(){
const E=s=>PA_esc(s),R=PA_R,BTN=PA_BTN,IN="width:100%;box-sizing:border-box;padding:12px;border-radius:10px;border:1px solid #2a2a31;background:#16161a;color:#f4f4f6;font-size:15px;margin-top:6px";
const CARD='background:#16161a;border-radius:12px;padding:12px;margin:10px 0';
const ALFA="abcdefghjkmnpqrstuvwxyz23456789",rnd=n=>Array.from(crypto.getRandomValues(new Uint8Array(n)),x=>ALFA[x%ALFA.length]).join("");
const slugDe=n=>(n.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,30)||"loja");
const num=v=>{const x=parseFloat(String(v).replace(",","."));return isFinite(x)&&x>=0?Math.round(x*100)/100:null};
function painel(titulo,corpo){const o=PA_ov('<div id="rh"></div>');o.firstChild.style.maxWidth="460px";o.firstChild.id="rh";return o}
/* redesenha sem apagar o que a pessoa está digitando */
const keep=(box,f)=>{const v={};box.querySelectorAll("input,select").forEach(e=>{if(e.id)v[e.id]=e.value});const a=document.activeElement&&document.activeElement.id;f();Object.keys(v).forEach(k=>{const e=box.querySelector("#"+CSS.escape(k));if(e&&v[k]!=="")e.value=v[k]});if(a){const e=box.querySelector("#"+CSS.escape(a));if(e)e.focus()}};
const fecha=b=>'<button data-a="x" style="background:#2a2a31;color:#f4f4f6;border:0;border-radius:8px;padding:8px 12px;font-weight:700">Fechar</button>';
window.PA_RH={
 /* ADM: avisa na hora quando um funcionário aguarda autorização */
 watchAdm(){const {F,db,au}=PA.fb;let prim=true;
  F.onSnapshot(F.query(F.collection(db,"equipe"),F.where("admId","==",au.currentUser.uid),F.where("st","==","pendente")),s=>{
   const n=s.size;if(!prim&&n>(PA.rhN||0)){try{PA_toast("👥 Funcionário aguardando autorização");navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}}
   prim=false;PA.rhN=n;window.PA_rr&&PA_rr();try{draw()}catch(e){}},e=>console.error("rh:",e))},
 adm(){const {F,db,au}=PA.fb,uid=au.currentUser.uid,o=painel(),box=o.firstChild;
  let LJ=[],CG=[],EQ=[],msg="";const un=[];
  const paint=()=>{const ativos=EQ.filter(e=>e.st==="ativo"),pend=EQ.filter(e=>e.st==="pendente"),sal=e=>(CG.find(c=>c.id===e.cargoId)||{}).salario||0,folha=ativos.reduce((t,e)=>t+sal(e),0);
   box.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:20px">👥 RH e Contabilidade</b>'+fecha()+'</div>'+(msg?'<div style="'+CARD+';border:2px solid #22a559">'+msg+'</div>':'')
   +'<div style="'+CARD+'"><b>➕ Nova loja</b><input id="ln" maxlength="40" placeholder="Nome da loja" style="'+IN+'"><select id="lp" style="'+IN+'">'+Object.entries(PA_PLANOS).map(([k,v])=>'<option value="'+k+'">'+E(v.n)+(v.p?' · '+R(v.p):' · R$ 1,00 no checkout + 0,5% balcão')+'</option>').join('')+'</select><div style="color:#a3a3ad;font-size:12.5px;margin-top:6px">Escolha o plano ANTES do link. Quem abrir o link e entrar com o Google vira o Gerente.</div><button data-a="nl" style="'+BTN+';background:#22a559;color:#fff">Criar loja e gerar link</button></div>'
   +'<div style="'+CARD+'"><b>🏪 Minhas lojas ('+LJ.length+')</b>'+LJ.map(l=>'<div style="margin-top:8px">'+E(l.nome)+' <span style="color:#a3a3ad">· '+E((PA_PLANOS[l.plano||"iniciante"]||{}).n)+(l.pendente?' · ⏳ aguardando gerente':' · ✔ com gerente')+'</span></div>').join('')+'</div>'
   +'<div style="'+CARD+'"><b>💼 Cargos e salários</b><div style="display:flex;gap:6px"><input id="cn" placeholder="Cargo (ex.: Caixa)" style="'+IN+'"><input id="cs" type="number" step="0.01" placeholder="R$" style="'+IN+';max-width:110px"></div><button data-a="nc" style="'+BTN+';background:#2a2a31;color:#f4f4f6;padding:10px">Salvar cargo</button>'
   +CG.map(c=>'<div style="display:flex;justify-content:space-between;margin-top:8px"><span>'+E(c.nome)+' · '+R(c.salario)+'</span><button data-a="dc" data-id="'+E(c.id)+'" style="background:none;border:0;color:#ff6b6b;font-weight:700">Excluir</button></div>').join('')+'</div>'
   +'<div style="'+CARD+';'+(pend.length?'border:2px solid #e0a800':'')+'"><b>⏳ Aguardando autorização ('+pend.length+')</b>'+pend.map(e=>'<div style="margin-top:10px"><b>'+E(e.email)+'</b><div style="color:#a3a3ad;font-size:12.5px">Loja: '+E((LJ.find(l=>l.id===e.slug)||{}).nome||e.slug)+'</div><select id="sc-'+E(e.id)+'" style="'+IN+'"><option value="">Escolha o cargo…</option>'+CG.map(c=>'<option value="'+E(c.id)+'">'+E(c.nome)+'</option>').join('')+'</select><button data-a="au" data-id="'+E(e.id)+'" style="'+BTN+';background:#22a559;color:#fff;padding:10px">Autorizar</button></div>').join('')+'</div>'
   +'<div style="'+CARD+'"><b>📒 Folha de pagamento mensal</b><div style="font-size:24px;font-weight:800;margin:6px 0">'+R(folha)+'</div>'+ativos.map(e=>'<div style="display:flex;justify-content:space-between;margin-top:6px"><span>'+E(e.email)+' · '+E(e.cargo||"—")+'</span><b>'+R(sal(e))+'</b></div>').join('')+'<button data-a="pdf" style="'+BTN+';background:#2a2a31;color:#f4f4f6;padding:10px">📄 Exportar PDF para o contador</button></div>'};
  const draw=()=>keep(box,paint);
  const L=(q,set)=>un.push(F.onSnapshot(q,s=>{set(s.docs.map(d=>({id:d.id,...d.data()})));draw()},e=>console.error("rh:",e)));
  L(F.query(F.collection(db,"lojas"),F.where("admId","==",uid)),a=>LJ=a);
  L(F.query(F.collection(db,"cargos"),F.where("admId","==",uid)),a=>CG=a);
  L(F.query(F.collection(db,"equipe"),F.where("admId","==",uid)),a=>EQ=a);
  box.onclick=async ev=>{const a=ev.target.dataset&&ev.target.dataset.a;if(!a)return;const id=ev.target.dataset.id,v=i=>box.querySelector(i).value;
   try{
    if(a==="x"){un.forEach(f=>f());o.remove();return}
    if(a==="nl"){const nome=v("#ln").trim(),pl=v("#lp");if(nome.length<2){alert("Digite o nome da loja.");return}
     const slug=slugDe(nome)+"-"+rnd(4),tok=rnd(24);
     await F.setDoc(F.doc(db,"lojas",slug),{nome,admId:uid,plano:pl,pendente:true,criadoEm:Date.now()});
     await F.setDoc(F.doc(db,"gerenteConvites",tok),{admId:uid,slug,nome,plano:pl,usado:false,criadoEm:Date.now()});
     const link=location.origin+"/lojista.html?gerente="+tok;msg='✅ Loja <b>'+E(nome)+'</b> criada ('+E(PA_PLANOS[pl].n)+').<div style="word-break:break-all;margin:8px 0">'+E(link)+'</div><button data-a="cl" data-id="'+E(link)+'" style="'+BTN+';background:#2a2a31;color:#f4f4f6;padding:10px">📋 Copiar link</button><button data-a="wl" data-id="'+E(link)+'" style="'+BTN+';background:#25d366;color:#fff;padding:10px">WhatsApp</button>';draw();return}
    if(a==="cl"){PA_copia(id);return}if(a==="wl"){PA_wa(id,"Seu acesso de Gerente no PedeAí:");return}
    if(a==="nc"){const n=v("#cn").trim(),s=num(v("#cs"));if(!n||s===null){alert("Informe o cargo e o salário.");return}await F.setDoc(F.doc(db,"cargos",uid+"__"+slugDe(n)),{admId:uid,nome:n,salario:s});return}
    if(a==="dc"){await F.deleteDoc(F.doc(db,"cargos",id));return}
    if(a==="au"){const cid=v("#sc-"+CSS.escape(id));if(!cid){alert("Escolha o cargo antes de autorizar.");return}const c=CG.find(x=>x.id===cid);await F.setDoc(F.doc(db,"equipe",id),{st:"ativo",cargo:c.nome,cargoId:c.id,em:Date.now()},{merge:true});return}
    if(a==="pdf"){const at=EQ.filter(e=>e.st==="ativo"),sal=e=>(CG.find(c=>c.id===e.cargoId)||{}).salario||0,w=window.open("","_blank");if(!w){alert("Libere pop-ups para exportar.");return}
     w.document.write('<!doctype html><meta charset="utf-8"><title>Folha de Pagamento</title><body style="font:14px system-ui;padding:24px"><h2>Folha de Pagamento Mensal — PedeAí</h2><div>Emitida em '+new Date().toLocaleDateString("pt-BR")+'</div><table style="border-collapse:collapse;width:100%;margin-top:14px"><tr><th align=left>Funcionário</th><th align=left>Loja</th><th align=left>Cargo</th><th align=right>Salário</th></tr>'+at.map(e=>'<tr><td>'+E(e.email)+'</td><td>'+E((LJ.find(l=>l.id===e.slug)||{}).nome||e.slug)+'</td><td>'+E(e.cargo)+'</td><td align=right>'+R(sal(e))+'</td></tr>').join('')+'<tr><td colspan=3><b>Total</b></td><td align=right><b>'+R(at.reduce((t,e)=>t+sal(e),0))+'</b></td></tr></table><p style="color:#666">Use “Salvar como PDF” na janela de impressão.</p><script>setTimeout(()=>print(),300)<\/script>');w.document.close();return}
   }catch(e){console.error(e);alert("Erro: "+(e.code||e.message))}};
  draw()},
 /* Gerente: cadastra o e-mail do funcionário (fica pendente até o ADM autorizar) */
 equipe(){const {F,db}=PA.fb,slug=PA.loja.slug,o=painel(),box=o.firstChild;let EQ=[],adm="";
  F.getDoc(F.doc(db,"lojas",slug)).then(s=>{adm=s.exists()?s.data().admId||"":""}).catch(()=>{});
  const un=F.onSnapshot(F.query(F.collection(db,"equipe"),F.where("slug","==",slug)),s=>{EQ=s.docs.map(d=>({id:d.id,...d.data()}));draw()},e=>console.error(e));
  const paint=()=>{box.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:20px">👥 Equipe</b>'+fecha()+'</div><div style="'+CARD+'"><b>Cadastrar funcionário</b><input id="fe" type="email" placeholder="E-mail Google do funcionário" style="'+IN+'"><div style="color:#a3a3ad;font-size:12.5px;margin-top:6px">Fica pendente. O ADM escolhe o cargo e autoriza; só então ele acessa a loja.</div><button data-a="add" style="'+BTN+';background:#22a559;color:#fff">Cadastrar</button></div>'
   +'<div style="'+CARD+'">'+(EQ.length?EQ.map(e=>'<div style="display:flex;justify-content:space-between;margin-top:8px"><span>'+E(e.email)+'<br><small style="color:#a3a3ad">'+(e.st==="ativo"?'✔ '+E(e.cargo||"ativo"):'⏳ pendente')+'</small></span><button data-a="rm" data-id="'+E(e.id)+'" style="background:none;border:0;color:#ff6b6b;font-weight:700">Remover</button></div>').join(''):'<span style="color:#a3a3ad">Nenhum funcionário ainda.</span>')+'</div>'};
  const draw=()=>keep(box,paint);
  box.onclick=async ev=>{const a=ev.target.dataset&&ev.target.dataset.a;if(!a)return;
   try{if(a==="x"){un();o.remove();return}
    if(a==="rm"){await F.deleteDoc(F.doc(db,"equipe",ev.target.dataset.id));return}
    if(a==="add"){const em=box.querySelector("#fe").value.trim().toLowerCase();if(!/^[^\s@\/]+@[^\s@\/]+\.[^\s@\/]+$/.test(em)){alert("E-mail inválido.");return}
     if(!adm){const s=await F.getDoc(F.doc(db,"lojas",slug));adm=s.exists()?s.data().admId||"":""}await F.setDoc(F.doc(db,"equipe",slug+"__"+em),{slug,email:em,st:"pendente",por:PA.user.email||"",admId:adm,criadoEm:Date.now()});}
   }catch(e){console.error(e);alert("Não foi possível cadastrar ("+(e.code||e.message)+")")}};
  draw()}
};
})();
