const fs=require('fs'),vm=require('vm');let ok=0,bad=0;const T=(n,c)=>{c?ok++:(bad++,console.log("FALHOU:",n));};
const DIA=864e5;
const store={};const win={localStorage:{getItem:()=>null,setItem(){},removeItem(){}},location:{search:"",origin:"https://x"},document:{},crypto:require('crypto').webcrypto};
const ctx=vm.createContext({window:win,document:{createElement(){return{style:{},appendChild(){}}},body:{appendChild(){},prepend(){}},getElementById(){return null}},localStorage:win.localStorage,location:win.location,URLSearchParams,crypto:win.crypto,navigator:{},console,Date,Math,setInterval(){},prompt(){}});
ctx.window=ctx;vm.runInContext(fs.readFileSync('conta.js','utf8'),ctx);
const W=ctx;
// ciclo de 33 dias
const t0=Date.UTC(2026,0,1),d={criadoEm:{toMillis:()=>t0}};
T("dia 30 ativa/avencer",['ativa','avencer'].includes(W.PA_estado(d,t0+30*DIA).k));
T("dia 31 carência",W.PA_estado(d,t0+31*DIA).k==='carencia');
T("dia 33 carência",W.PA_estado(d,t0+32.9*DIA).k==='carencia');
T("dia 34 travada",W.PA_estado(d,t0+33.1*DIA).k==='travada');
T("tabela planos loja",W.PA_PLANOS.mensal.p===199.9&&W.PA_PLANOS.anual.p===1999&&W.PA_PLANOS['3anos'].p===4799&&W.PA_PLANOS['5anos'].p===7199);
T("plano ADM mensal 299,90",W.PA_ADMP.mensal.p===299.9);
// D-1
const hoje0=W.PA_fatura.hoje0(),ontem=hoje0-3600e3,hoje=hoje0+3600e3;
const mk=(docs)=>({F:{collection:(db,n)=>({n}),where:(f,o,v)=>({f,v}),query:(c,w)=>({c,w}),getDocs:async q=>({docs:(q.c.n==='pedidos'?docs.pedidos.filter(p=>p.loja===q.w.v):docs.lojas).map(x=>({id:x.id||x.loja,data:()=>x}))})},db:{}});
const base=hoje0-5*DIA;const dd=(venc)=>({venc,uid:'A1',loja:{slug:'l1'}});
const pedidos=[{loja:'l1',criadoEm:ontem,ts:1,cli:'Ana',st:'entregue',v:50},{loja:'l1',criadoEm:ontem,ts:1,cli:'Bia',st:'entregue',v:30},{loja:'l1',criadoEm:hoje,ts:1,cli:'Cy',st:'novo',v:20},{loja:'l1',criadoEm:ontem,ts:1,cli:'Di',st:'cancelado',v:9},{loja:'l1',criadoEm:ontem,cli:'Avulso',st:'entregue',v:200}];
(async()=>{
 W.PA={fb:mk({pedidos,lojas:[{id:'l1',admId:'A1',plano:'iniciante'}]})};
 const fm=await W.PA_fatura.congelado(W.PA.fb.F,{},'lojista',dd(base+30*DIA));
 T("loja Iniciante: R$1 por pedido até ontem (hoje fora, cancelado fora, avulso fora) = 2,00",fm===2);
 const fa=await W.PA_fatura.congelado(W.PA.fb.F,{},'adm',dd(base+30*DIA));
 T("ADM: 0,5% do balcão de ontem = 1,00",fa===1);
 W.PA={fb:mk({pedidos,lojas:[{id:'l1',admId:'A1',plano:'mensal'}]})};
 T("loja paga isenta (ADM não paga 0,5%)",await W.PA_fatura.congelado(W.PA.fb.F,{},'adm',dd(base+30*DIA))===0);
 W.PA={fb:mk({pedidos,lojas:[{id:'l1',admId:'A1',plano:'iniciante'}]})};
 T("ADM com plano pago isento",await W.PA_fatura.congelado(W.PA.fb.F,{},'adm',{...dd(base+30*DIA),plano:'mensal'})===0);
 console.log(`testes: ${ok} ok, ${bad} falharam`);process.exit(bad?1:0)})();
