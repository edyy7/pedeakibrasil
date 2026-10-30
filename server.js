const http=require('http'),fs=require('fs'),path=require('path');
const APP=process.argv[2],PORT=8765;const DB={};const LOG=[];let CLOCK=null,RT=0;
const now=()=>CLOCK||Date.now(),CRIADOR='edinaldooliveiradesouza@gmail.com';
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png'};
const clone=o=>o===undefined?undefined:JSON.parse(JSON.stringify(o));
const g=p=>DB[p]?DB[p]:null;
function resolve(d,reqTime){const o={};for(const k of Object.keys(d)){const v=d[k];o[k]=v&&v.__ts?{__ts:reqTime}:v}return o}
function applyDel(o){for(const k of Object.keys(o))if(o[k]&&o[k].__del)delete o[k];return o}
function diffKeys(a,b){a=a||{};b=b||{};const ks=new Set([...Object.keys(a),...Object.keys(b)]);return [...ks].filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k]))}
const hasOnly=(ks,l)=>ks.every(k=>l.includes(k)),hasAny=(ks,l)=>ks.some(k=>l.includes(k));
/* ===== oráculo das regras (porta de firestore.rules) ===== */
function rules(A,op,p,res,req){ // op: get|list|create|update|delete
 const [col,id]=p.split('/'),signed=!!A,uid=A&&A.uid,email=A&&A.email?A.email.toLowerCase():'';
 const crit=signed&&A.email===CRIADOR&&A.email_verified===true;
 const lj=s=>g('lojas/'+s),cf=g('meta/config');
 const dono=s=>s!==''&&lj(s)&&(lj(s).dono||'')===uid, adm=s=>s!==''&&lj(s)&&(lj(s).admId||'')===uid;
 const eqA=s=>signed&&s!==''&&email&&g('equipe/'+s+'__'+email)&&(g('equipe/'+s+'__'+email).st||'')==='ativo';
 const mb=s=>{const c=g('contas/'+uid+'_motoboy');return s!==''&&c&&((c.loja||{}).slug||'')===s};
 const veLoja=d=>(d.uid||'')===uid||(d.mot||'')===uid||dono(d.loja||'')||eqA(d.loja||'')||adm(d.loja||'')||mb(d.loja||'');
 const venc=c=>c.venc!==undefined?c.venc:(c.criadoEm.__ts+2592000000);
 const contaLib=u=>{if(cf&&((cf.valores||{}).lojista===0))return true;const c=g('contas/'+u+'_lojista');return !!c&&venc(c)+259200000>=RT};
 const lojaLib=s=>{const l=lj(s);return !l||((l.suspensa||false)!==true&&(l.pendente||false)!==true&&(!('dono' in l)||contaLib(l.dono)))};
 const dk=diffKeys(res,req);
 switch(col){
  case 'pedidos':
   if(op==='get'||op==='list')return signed&&(crit||veLoja(res));
   if(op==='create')return signed&&lojaLib(req.loja||'x');
   if(op==='update')return signed&&(crit||(res.uid||'')===uid||dono(res.loja||'')||eqA(res.loja||'')||(res.mot||'')===uid||(mb(res.loja||'')&&!('mot' in res)&&hasOnly(dk,['mot','motN','atualizadoEm'])&&req.mot===uid));
   if(op==='delete')return crit||(signed&&dono(res.loja||''));return false;
  case 'ocorrencias':return signed;
  case 'meta':return id==='config'?(op==='get'||op==='list'?signed:crit):signed;
  case 'contas':
   if(op==='get'){const lm=res&&res.papel==='lojista'&&res.loja;return signed&&(id.startsWith(uid+'_')||crit||(res.papel==='lojista'&&res.loja&&adm(res.loja.slug))||(lm&&eqA(res.loja.slug)))}
   if(op==='list')return crit;
   if(op==='create')return signed&&req.uid===uid&&['lojista','motoboy','adm'].includes(req.papel)&&id===uid+'_'+req.papel&&req.criadoEm&&req.criadoEm.__ts===RT&&hasOnly(Object.keys(req),['uid','email','nome','papel','criadoEm','visto']);
   if(op==='update'){if(crit)return true;
    if(res.papel==='lojista'&&res.loja&&adm(res.loja.slug)&&hasOnly(dk,['venc','admAlt','vencBase'])&&req.admAlt===(res.admAlt||0)+1&&req.admAlt<=2&&req.vencBase===(res.vencBase!==undefined?res.vencBase:venc(res))&&req.venc<=req.vencBase+432000000&&req.venc>=RT)return true;
    if(!(signed&&res.uid===uid))return false;
    return (hasOnly(dk,['admCodigo'])&&res.papel==='adm'&&!('admCodigo' in res)&&/^ADM-[A-Z0-9-]+$/.test(req.admCodigo)&&(g('admCodigos/'+req.admCodigo)||{}).uid===uid)
     ||hasOnly(dk,['visto'])||(hasOnly(dk,['aceite'])&&res.papel==='motoboy'&&!('aceite' in res))
     ||(hasOnly(dk,['loja'])&&!('loja' in res))
     ||(hasOnly(dk,['loja'])&&res.papel==='motoboy'&&g('convites/'+req.loja.convite)&&g('convites/'+req.loja.convite).slug===req.loja.slug)
     ||(hasOnly(dk,['convite'])&&res.papel==='lojista')||(hasOnly(dk,['pagto'])&&req.pagto.st==='analise')}
   return false;
  case 'convites':
   if(op==='get')return signed;if(op==='create')return signed&&req.dono===uid&&((lj(req.slug)||{}).dono||'')===uid;if(op==='delete')return signed&&res.dono===uid;return false;
  case 'admCodigos':
   if(op==='get')return signed;if(op==='create'){const c=g('contas/'+uid+'_adm');return signed&&/^ADM-[A-Z0-9-]+$/.test(id)&&req.uid===uid&&hasOnly(Object.keys(req),['uid','nome','criadoEm'])&&!!c&&!('admCodigo' in c)}
   return op==='delete'&&crit;
  case 'gerenteConvites':
   if(op==='get')return signed;if(op==='list')return false;
   if(op==='create')return signed&&id.length>=16&&req.admId===uid&&!!g('contas/'+uid+'_adm')&&hasOnly(Object.keys(req),['admId','slug','nome','plano','usado','criadoEm'])&&req.usado===false;
   if(op==='update')return signed&&res.usado===false&&hasOnly(dk,['usado','uid','em'])&&req.usado===true&&req.uid===uid;
   return op==='delete'&&signed&&res.admId===uid;
  case 'equipe':{
   const ve=e=>crit||(signed&&(e.email||'')===A.email)||(signed&&(e.admId||'')===uid)||dono(e.slug||'')||adm(e.slug||'');
   if(op==='get'||op==='list')return ve(res);
   if(op==='create')return signed&&dono(req.slug)&&req.st==='pendente'&&id===req.slug+'__'+req.email&&req.email===req.email.toLowerCase()&&req.admId===((lj(req.slug)||{}).admId||'')&&hasOnly(Object.keys(req),['slug','email','st','por','admId','criadoEm']);
   if(op==='update')return crit||(signed&&(res.admId||'')===uid&&hasOnly(dk,['st','cargo','cargoId','em']));
   return crit||dono(res.slug||'')||adm(res.slug||'')}
  case 'cargos':
   if(op==='get'||op==='list')return signed&&(crit||(res.admId||'')===uid);
   if(op==='create'||op==='update')return signed&&req.admId===uid&&(op==='create'||res.admId===uid)&&hasOnly(Object.keys(req),['admId','nome','salario'])&&typeof req.salario==='number'&&req.salario>=0;
   return signed&&res.admId===uid;
  case 'lojas':
   if(op==='get')return signed;
   if(op==='list')return crit||(signed&&(res.admId||'')===uid)||(signed&&(res.dono||'')===uid);
   if(op==='create')return signed&&req.admId===uid&&!!g('contas/'+uid+'_adm')&&req.pendente===true&&!('dono' in req)&&!('suspensa' in req)&&['iniciante','mensal','anual','3anos','5anos'].includes(req.plano);
   if(op==='update'){if(crit)return true;
    if(signed&&!('dono' in res)&&res.pendente===true&&hasOnly(dk,['dono','pendente','gerenteToken'])&&req.dono===uid&&req.pendente===false){const c=g('gerenteConvites/'+req.gerenteToken);if(c&&c.slug===id&&(c.uid||'')===uid)return true}
    if(signed&&res.pendente!==true&&(('dono' in res)?res.dono:uid)===uid&&(('dono' in req)?req.dono:uid)===(('dono' in res)?res.dono:uid)&&!hasAny(dk,['admId','admCodigo','suspensa','suspEm','plano','pendente','gerenteToken']))return true;
    return signed&&(res.admId||'')===uid&&hasOnly(dk,['suspensa','suspEm'])}
   return false}
 return false}
/* ===== API ===== */
function match(d,w){return (w||[]).every(([f,o,v])=>d[f]===v)}
function body(req){return new Promise(r=>{let b='';req.on('data',c=>b+=c);req.on('end',()=>r(b?JSON.parse(b):{}))})}
http.createServer(async(rq,rs)=>{
 const u=new URL(rq.url,'http://x');
 if(u.pathname==='/__op'){const b=await body(rq),A=b.auth,t=now();RT=t;const out=x=>{rs.setHeader('content-type','application/json');rs.end(JSON.stringify(x))};
  const deny=(why)=>{LOG.push({deny:why,user:A&&A.email,op:b.op,path:b.path||b.col});out({err:'permission-denied'})};
  try{
  if(b.op==='get'){const d=g(b.path);const ok=rules(A,'get',b.path,d,null);if(d===null){/*doc inexistente: regras com resource.data falham, exceto regras sem resource*/ if(!['pedidos','meta','lojas','gerenteConvites','convites','admCodigos'].includes(b.path.split('/')[0])&&A){/* Firestore devolve negação p/ get inexistente quando a regra lê resource.data */}
    const col=b.path.split('/')[0];const okN=['lojas','meta','convites','admCodigos','gerenteConvites'].includes(col)?!!A:(col==='contas'?(b.path.split('/')[1]||'').startsWith((A||{}).uid+'_'):false);return okN?out({data:null}):deny('get-inexistente');}
   if(!ok)return deny('get');return out({data:d})}
  if(b.op==='query'){const pre=b.col;const ws=b.where||[];const has=f=>ws.some(w=>w[0]===f);
   const need={pedidos:()=>has('loja')||has('mot'),equipe:()=>has('email')||has('slug')||has('admId'),cargos:()=>has('admId'),lojas:()=>has('admId')||has('dono'),contas:()=>false}[pre];
   if(need&&!need()&&!(A&&A.email===CRIADOR))return deny('query-ampla');
   const docs=Object.keys(DB).filter(k=>k.startsWith(pre+'/')&&!k.slice(pre.length+1).includes('/')).filter(k=>match(DB[k],ws));
   for(const k of docs)if(!rules(A,'list',k,DB[k],null))return deny('list '+k);
   return out({docs:docs.map(k=>({id:k.split('/')[1],data:DB[k]}))})}
  if(b.op==='write'){const ws=b.writes;const stage={};
   for(const w of ws){const cur=stage[w.path]!==undefined?stage[w.path]:g(w.path);
    if(w.kind==='delete'){if(cur&&!rules(A,'delete',w.path,cur,null))return deny('delete '+w.path);stage[w.path]=null;continue}
    let nv;const d=w.data;
    if(w.merge||w.kind==='update'){nv=Object.assign({},cur||{},resolve(d,t));applyDel(nv)}else nv=applyDel(resolve(d,t));
    const op=cur?'update':'create';
    if(!rules(A,op,w.path,cur,nv))return deny(op+' '+w.path+' keys='+diffKeys(cur,nv));
    stage[w.path]=nv}
   for(const k of Object.keys(stage)){if(stage[k]===null)delete DB[k];else DB[k]=stage[k]}return out({ok:1})}
  }catch(e){LOG.push({erro:String(e.stack||e)});rs.statusCode=500;out({err:String(e)})}return}
 if(u.pathname==='/__admin'){const b=await body(rq);if(b.set)for(const k in b.set)DB[k]=b.set[k];if(b.del)delete DB[b.del];if('clock'in b)CLOCK=b.clock;rs.end(JSON.stringify({db:DB,log:LOG,now:now()}));return}
 if(u.pathname==='/__dump'){rs.end(JSON.stringify({db:DB,log:LOG}));return}
 let f=path.join(APP,u.pathname==='/'?'index.html':u.pathname);if(!fs.existsSync(f)){rs.statusCode=404;return rs.end('nf')}
 rs.setHeader('content-type',mime[path.extname(f)]||'text/plain');rs.end(fs.readFileSync(f))}).listen(PORT,()=>console.log('up'));
