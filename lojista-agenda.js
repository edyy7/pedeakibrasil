/* Loja: abas por módulo, marca (cor/logo), agenda e serviços */
const VIS={caixa:"gestao",hist:"gestao",gestao:"gestao",equipe:"gestao",compart:"loja"};
function visivel(k){const m=window.MODS||{};if(k==="agenda")return m.agenda===true;const g=VIS[k];if(!g)return true;return m[g]!==false}
const ymd=x=>x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");
async function upImg(f,pasta){const S=await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js");const st=S.getStorage(PA.fb.au.app);const r=S.ref(st,pasta+"-"+Date.now()+".jpg");await S.uploadBytes(r,f,{contentType:f.type});return S.getDownloadURL(r)}
function imgDim(f){return new Promise((ok,er)=>{const u=URL.createObjectURL(f),im=new Image();im.onload=()=>{ok({w:im.width,h:im.height});URL.revokeObjectURL(u)};im.onerror=()=>er(new Error("img"));im.src=u})}
/* ---- Marca ---- */
function marcaCard(){const b=window.MARCA_CFG||{};const cor=MARCA.hex(b.cor)?"#"+MARCA.hex(b.cor):"#d4141c";
 return `<div class="oc"><b>🎨 Marca da loja</b><div class="meta" style="margin:4px 0">Cor principal: o texto fica preto ou branco sozinho, para ler bem. Logo horizontal fica centralizado; vertical, à esquerda.</div><label class="l">Cor principal</label><input id="mcor" type="color" value="${cor}" style="width:100%;height:48px;border:0;background:none"><label class="l">Logo (imagem até 3 MB)</label><input id="mlogo" type="file" accept="image/*"><div class="meta">${b.logoUrl?"Logo atual: "+(b.logoOrient==="vertical"?"vertical (à esquerda)":"horizontal (centralizado)"):"Sem logo ainda."}</div><button class="cta" onclick="marcaSalva()">Salvar marca</button></div>`}
async function marcaSalva(){
 const cor=MARCA.hex($("mcor").value);if(!cor){toast("Cor inválida");return}
 const b={...(window.MARCA_CFG||{}),cor:"#"+cor};const f=$("mlogo").files[0];
 try{
  if(f){if(f.size>3*1024*1024||!/^image\//.test(f.type)){toast("Logo: imagem de até 3 MB");return}
   toast("Enviando logo…");const d=await imgDim(f);b.logoUrl=await upImg(f,"lojas/"+SLUG+"/logo");b.logoOrient=d.w>=d.h?"horizontal":"vertical"}
  await PA.setLojaCfg(SLUG,{brand:b});toast("Marca salva")}
 catch(e){console.error(e);toast("Não foi possível salvar a marca")}}
/* ---- Agenda ---- */
const AG={srv:null,book:null,ld:false};
async function agLoad(){if(AG.ld)return;AG.ld=true;const F=PA.fb.F,db=PA.fb.db;
 try{const s=await F.getDocs(F.query(F.collection(db,"servicos"),F.where("loja","==",SLUG)));AG.srv=s.docs.map(d=>({id:d.id,...d.data()}));
  const b=await F.getDocs(F.query(F.collection(db,"agendamentos"),F.where("loja","==",SLUG)));AG.book=b.docs.map(d=>({id:d.id,...d.data()})).sort((x,y)=>((x.data||"")+(x.hora||"")).localeCompare((y.data||"")+(y.hora||"")))}
 catch(e){console.error(e);AG.srv=AG.srv||[];AG.book=AG.book||[];toast("Não foi possível carregar a agenda")}
 AG.ld=false;draw()}
function agendaTab(){
 if(AG.srv===null){agLoad();return `<div class="oc"><div class="meta">Carregando agenda…</div></div>`}
 const A=window.AGC||{},pg=A.pgto||"local",hoje=ymd(new Date());
 const radio=(v,l,ds)=>`<label style="display:flex;gap:8px;align-items:flex-start;margin:8px 0"><input type="radio" name="apg" value="${v}" ${pg===v?"checked":""} style="width:20px;height:20px;margin-top:2px"><span><b>${l}</b><div class="meta">${ds}</div></span></label>`;
 const fut=(AG.book||[]).filter(x=>(x.data||"")>=hoje);
 const ST={confirmado:"Confirmado",aguardando_confirmacao:"Aguardando sua confirmação do Pix",aguardando_pagamento:"Aguardando pagamento"};
 const PGL={local:"pago no local",pix:"Pix direto",gateway:"Pix automático"};
 return `<div class="oc"><b>📅 Agenda e mini-site</b>
 <label class="l">Apresentação (bio)</label><textarea id="abio" rows="3" maxlength="400">${MARCA.esc(A.bio||"")}</textarea>
 <label class="l">Foto (opcional)</label><input id="afoto" type="file" accept="image/*"><div class="meta">${A.fotoUrl?"Foto cadastrada.":"Sem foto ainda."}</div>
 <div class="meta" style="margin-top:10px;font-weight:800">Pagamento do agendamento (você escolhe)</div>
 ${radio("gateway","1. Cobrar sinal via Pix automático","Gera o Pix pela conta de recebimento da loja; a confirmação é automática.")}
 ${radio("pix","2. Pix direto (sua chave)","O cliente paga na sua chave; você confirma o recebimento na agenda.")}
 ${radio("local","3. Pagar no local","Agenda grátis; o cliente paga no atendimento.")}
 <label class="l">Sua chave Pix (opção 2)</label><input id="apix" maxlength="80" value="${MARCA.esc(A.pix||"")}">
 <label class="l">ID de recebimento Asaas (opção 1 e Pix automático dos pedidos)</label><input id="awid" maxlength="80" value="${MARCA.esc(window.AWID||"")}">
 <label class="l">Horário de atendimento</label><div class="two"><input id="aini" type="time" value="${A.ini||"09:00"}"><input id="afim" type="time" value="${A.fim||"18:00"}"></div>
 <label class="l">Intervalo entre horários (minutos)</label><input id="aint" type="number" min="5" max="240" value="${A.intervalo||30}">
 <button class="cta" onclick="agSalvaCfg()">Salvar agenda</button></div>
 <div class="oc"><b>💇 Serviços</b>${AG.srv.map(s=>`<div class="ln"><span><b>${MARCA.esc(s.nome)}</b><div class="meta">${s.min} min · ${R$(s.preco)}</div></span><button class="cta o" style="width:auto" onclick="srvDel('${s.id}')">Remover</button></div>`).join("")||`<div class="meta">Nenhum serviço cadastrado.</div>`}
 <label class="l">Novo serviço</label><input id="snome" maxlength="60" placeholder="Nome do serviço"><div class="two"><input id="smin" type="number" min="5" max="600" placeholder="Minutos"><input id="spreco" inputmode="decimal" placeholder="Preço (R$)"></div><button class="cta" onclick="srvAdd()">Adicionar serviço</button></div>
 <div class="oc"><b>🗓️ Próximos agendamentos (${fut.length})</b>${fut.map(x=>`<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--br)"><b>${MARCA.esc(x.data)} ${MARCA.esc(x.hora)} · ${MARCA.esc(x.servicoNome||"")}</b><div class="meta">${MARCA.esc(x.nomeCli||"")} · ${MARCA.esc(x.telCli||"")} · ${PGL[x.pgto]||""}</div><div class="meta" style="font-weight:800">${ST[x.status]||MARCA.esc(x.status)}</div><div class="two">${x.status!=="confirmado"&&x.pgto==="pix"?`<button class="cta" onclick="agOk('${x.id}')">Recebi o Pix</button>`:""}<button class="cta o" onclick="agCancela('${x.id}')">Cancelar</button></div></div>`).join("")||`<div class="meta">Nenhum agendamento futuro.</div>`}</div>`}
async function agSalvaCfg(){
 try{const pgto=(document.querySelector('input[name=apg]:checked')||{}).value||"local";const pix=($("apix").value||"").trim();
  if(pgto==="pix"&&pix.length<5){toast("Informe a chave Pix para a opção 2");return}
  const ini=$("aini").value||"09:00",fim=$("afim").value||"18:00",intervalo=Math.max(5,Math.min(240,Number($("aint").value)||30));
  if(ini>=fim){toast("O horário final deve ser depois do inicial");return}
  let fotoUrl=(window.AGC||{}).fotoUrl||"";const f=$("afoto").files[0];
  if(f){if(f.size>3*1024*1024||!/^image\//.test(f.type)){toast("Foto: imagem de até 3 MB");return}toast("Enviando foto…");fotoUrl=await upImg(f,"lojas/"+SLUG+"/foto")}
  await PA.setLojaCfg(SLUG,{agenda:{pgto,pix,ini,fim,intervalo,bio:($("abio").value||"").slice(0,400),fotoUrl},asaasWalletId:$("awid").value.trim()});
  toast("Agenda salva")}
 catch(e){console.error(e);toast("Não foi possível salvar a agenda")}}
async function srvAdd(){const nome=($("snome").value||"").trim(),min=Math.round(Number($("smin").value)),preco=num($("spreco").value);
 if(nome.length<2){toast("Informe o nome do serviço");return}if(!(min>=5&&min<=600)){toast("Duração entre 5 e 600 minutos");return}if(!(preco>=0)){toast("Preço inválido");return}
 try{const F=PA.fb.F,db=PA.fb.db;const ref=F.doc(F.collection(db,"servicos"));await F.setDoc(ref,{loja:SLUG,nome,min,preco,criadoEm:Date.now()});AG.srv.push({id:ref.id,loja:SLUG,nome,min,preco});draw();toast("Serviço adicionado")}
 catch(e){console.error(e);toast("Não foi possível salvar o serviço")}}
async function srvDel(id){try{await PA.fb.F.deleteDoc(PA.fb.F.doc(PA.fb.db,"servicos",id));AG.srv=AG.srv.filter(s=>s.id!==id);draw()}catch(e){console.error(e);toast("Não foi possível remover")}}
async function agOk(id){try{await PA.fb.F.setDoc(PA.fb.F.doc(PA.fb.db,"agendamentos",id),{status:"confirmado",confirmadoEm:Date.now()},{merge:true});const b=AG.book.find(x=>x.id===id);if(b)b.status="confirmado";draw();toast("Pix confirmado")}catch(e){console.error(e);toast("Não foi possível confirmar")}}
async function agCancela(id){if(!confirm("Cancelar este agendamento? O horário ficará livre."))return;try{const F=PA.fb.F,db=PA.fb.db;await F.deleteDoc(F.doc(db,"agendamentos",id));await F.deleteDoc(F.doc(db,"ocupados",id));AG.book=AG.book.filter(x=>x.id!==id);draw();toast("Agendamento cancelado")}catch(e){console.error(e);toast("Não foi possível cancelar")}}
