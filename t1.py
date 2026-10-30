import json,re,sys,time,urllib.request
from playwright.sync_api import sync_playwright
from fb import *
BASE="http://localhost:8765"
def admin(**k):
    r=urllib.request.Request(BASE+"/__admin",json.dumps(k).encode(),{"content-type":"application/json"});return json.load(urllib.request.urlopen(r))
R=[];ERR=[]
def T(n,c,extra=""):
    R.append((n,bool(c)));print(("OK   " if c else "FALHA"),n,extra if not c else "")
with sync_playwright() as p:
    b=p.chromium.launch()
    def ctx(email,name):
        c=b.new_context(service_workers="block",viewport={"width":390,"height":800})
        uid="u-"+email.split("@")[0]
        c.add_init_script("window.__NEXT_USER=%s"%json.dumps({"uid":uid,"email":email,"displayName":name,"email_verified":True}))
        def route(r):
            u=r.request.url
            body=APP_JS if "firebase-app" in u else FS_JS if "firestore" in u else AUTH_JS
            r.fulfill(status=200,content_type="text/javascript",body=body)
        c.route("https://www.gstatic.com/**",route)
        c.route("https://fonts.googleapis.com/**",lambda r:r.fulfill(status=200,body=""))
        return c
    def page(c,url):
        pg=c.new_page();pg.on("pageerror",lambda e:ERR.append(("pageerror",url,str(e)[:200])))
        pg.on("console",lambda m:ERR.append(("console",url,m.text[:200])) if m.type=="error" and "favicon" not in m.text else None)
        pg.goto(BASE+url);return pg
    def login(pg):
        pg.wait_for_selector("#pa-g",timeout=8000);pg.click("#pa-g")
    # ---------- ADM ----------
    cA=ctx("adm1@x.com","Ana ADM");A=page(cA,"/adm.html");login(A)
    A.wait_for_function("window.PA&&PA.ready",timeout=8000)
    T("ADM entra e conta criada",admin().get("db",{}).get("contas/u-adm1_adm") is not None)
    A.click("text=👥 RH");A.wait_for_selector("#rh #ln")
    A.fill("#cn","Caixa");A.fill("#cs","1800");A.click("[data-a=nc]");A.wait_for_selector("text=Caixa · R$")
    T("cargo salvo",any(k.startswith("cargos/") for k in admin()["db"]))
    A.fill("#ln","Padaria Boa");A.select_option("#lp","iniciante");A.click("[data-a=nl]")
    A.wait_for_selector("text=criada",timeout=6000)
    txt=A.inner_text("#rh");m=re.search(r"http://localhost:8765/lojista\.html\?gerente=([A-Za-z0-9]+)",txt)
    T("link do Gerente gerado",bool(m));tok=m.group(1) if m else "x"
    db=admin()["db"];slug=[k.split("/")[1] for k in db if k.startswith("lojas/")][0]
    T("loja criada pendente com plano",db["lojas/"+slug].get("pendente") is True and db["lojas/"+slug]["plano"]=="iniciante")
    # cliente antes do gerente
    cC=ctx("c@x.com","Cli");C=page(cC,"/cliente.html?loja="+slug)
    C.wait_for_function("window.PA&&PA.ready",timeout=8000);C.wait_for_timeout(800)
    T("cliente: taxa de serviço R$1 (Iniciante)",C.evaluate("TS")==1,C.evaluate("TS"))
    r=C.evaluate("PA.setPedido(9001,{loja:'%s',uid:PA.uid,cli:'x',tt:10,v:10,st:'novo',criadoEm:Date.now()}).then(()=>'criado').catch(e=>'negado')"%slug)
    T("pedido em loja SEM gerente é recusado pelo servidor",r=="negado",r)
    # ---------- Gerente ----------
    cG=ctx("ger@x.com","Gil Gerente");G=page(cG,"/lojista.html?gerente="+tok);login(G)
    G.wait_for_function("window.PA&&PA.loja",timeout=10000)
    d=admin()["db"]
    T("1º login vira Gerente (dono)",d["lojas/"+slug].get("dono")=="u-ger" and d["lojas/"+slug].get("pendente") is False)
    T("convite marcado como usado",d["gerenteConvites/"+tok].get("usado") is True)
    T("conta do gerente aponta a loja",(d["contas/u-ger_lojista"].get("loja") or {}).get("slug")==slug)
    G.wait_for_timeout(600)
    r=C.evaluate("PA.setPedido(9002,{loja:'%s',uid:PA.uid,cli:'x',tt:10,v:10,st:'novo',criadoEm:Date.now()-86400000,ts:1}).then(()=>'criado').catch(e=>'negado')"%slug)
    T("pedido em loja com gerente é aceito",r=="criado",r)
    # 2º dispositivo tentando o mesmo link
    cG2=ctx("intruso@x.com","Intruso");G2=page(cG2,"/lojista.html?gerente="+tok);login(G2)
    G2.wait_for_selector("text=inválido ou já usado",timeout=8000)
    T("link de Gerente não vale 2 vezes",admin()["db"]["lojas/"+slug]["dono"]=="u-ger")
    # ---------- Equipe ----------
    G.click("text=👥 Equipe");G.wait_for_selector("#rh #fe");G.fill("#fe","func@x.com");G.click("[data-a=add]")
    G.wait_for_function("document.querySelector('#rh').innerText.includes('⏳ pendente')",timeout=6000)
    T("e-mail do funcionário salvo como pendente",(admin()["db"].get("equipe/%s__func@x.com"%slug) or {}).get("st")=="pendente")
    cF=ctx("func@x.com","Fábio Func");F_=page(cF,"/lojista.html");login(F_)
    F_.wait_for_selector("text=Aguardando autorização",timeout=8000)
    T("funcionário cai na sala de espera",True)
    # ADM autoriza
    A.wait_for_timeout(600)
    T("ADM vê contador de pendentes",A.inner_text("body").find("RH (1)")>=0 or A.evaluate("PA.rhN")==1,A.evaluate("PA.rhN"))
    A.click("text=Fechar");A.click("text=👥 RH");A.wait_for_selector("text=Aguardando autorização (1)")
    cid=A.eval_on_selector("select[id^=sc-] option:nth-child(2)","o=>o.value");A.select_option("select[id^=sc-]",cid);A.click("[data-a=au]")
    F_.wait_for_function("window.PA&&PA.equipe&&PA.loja",timeout=10000)
    T("funcionário liberado após autorização do ADM",F_.evaluate("PA.equipe.st")=="ativo" and F_.evaluate("PA.equipe.cargo")=="Caixa")
    T("funcionário não vê 'Pagar' nem 'Equipe' na barra",("Pagar" not in F_.inner_text("body")) and ("👥 Equipe" not in F_.inner_text("body")))
    A.wait_for_function("document.querySelector('#rh').innerText.replace(/\\s/g,' ').includes('R$ 1.800,00')",timeout=6000)
    T("folha mensal soma o salário (R$ 1.800,00)",True)
    # gerente tenta se autoaprovar (deve negar)
    r=G.evaluate("PA.fb.F.setDoc(PA.fb.F.doc(PA.fb.db,'equipe','%s__x@y.com'),{slug:'%s',email:'x@y.com',st:'ativo',por:'g',admId:'u-adm1',criadoEm:1}).then(()=>'ok').catch(e=>'negado')"%(slug,slug))
    T("Gerente NÃO consegue criar funcionário já ativo",r=="negado",r)
    r=G.evaluate("PA.fb.F.setDoc(PA.fb.F.doc(PA.fb.db,'equipe','%s__func@x.com'),{st:'ativo'},{merge:true}).then(()=>'ok').catch(e=>'negado')"%slug)
    T("Gerente NÃO consegue alterar status do funcionário",r=="negado",r)
    r=F_.evaluate("PA.fb.F.setDoc(PA.fb.F.doc(PA.fb.db,'equipe','%s__func@x.com'),{cargo:'Dono'},{merge:true}).then(()=>'ok').catch(e=>'negado')"%slug)
    T("Funcionário NÃO consegue alterar o próprio cargo",r=="negado",r)
    r=G.evaluate("PA.fb.F.setDoc(PA.fb.F.doc(PA.fb.db,'lojas','%s'),{plano:'5anos'},{merge:true}).then(()=>'ok').catch(e=>'negado')"%slug)
    T("Gerente NÃO consegue trocar o plano da loja",r=="negado",r)
    # ---------- Mensal: sem taxa ----------
    A.click("text=Fechar");A.click("text=👥 RH");A.wait_for_selector("#rh #ln");A.fill("#ln","Loja Paga");A.select_option("#lp","anual");A.click("[data-a=nl]");A.wait_for_selector("text=criada",timeout=6000)
    slug2=[k.split("/")[1] for k,v in admin()["db"].items() if k.startswith("lojas/") and v.get("plano")=="anual"][0]
    C2=page(cC,"/cliente.html?loja="+slug2);C2.wait_for_function("window.PA&&PA.ready");C2.wait_for_timeout(900)
    T("cliente: loja de plano pago NÃO tem taxa",C2.evaluate("TS")==0,C2.evaluate("TS"))
    # ---------- Vencimento / D-1 / trava ----------
    now=admin()["now"];day=86400000
    d0=time.localtime();import datetime
    mid=int(datetime.datetime.now().replace(hour=0,minute=0,second=0,microsecond=0).timestamp()*1000)
    ped={}
    for i,(t,ts,cli,st) in enumerate([(mid-3600000,1,"Ana","entregue"),(mid-7200000,1,"Bia","entregue"),(mid+60000,1,"Cy","novo"),(mid-3600000,1,"Di","cancelado")]):
        ped["pedidos/%d"%(7000+i)]={"id":7000+i,"loja":slug,"uid":"anon-z","cli":cli,"tt":10,"v":10,"ts":ts,"st":st,"criadoEm":t}
    conta=admin()["db"]["contas/u-ger_lojista"]
    admin(set=dict(ped,**{"contas/u-ger_lojista":dict(conta,venc=now-34*day)}))
    G.reload();G.wait_for_selector("text=Fatura congelada",timeout=10000);G.wait_for_timeout(1200)
    body=G.inner_text("body").replace("\xa0"," ")
    T("Trava Total: gerente vê tela de pagamento no 34º dia",("Fatura congelada" in body))
    T("valor congelado D-1 = R$ 3,00 (3 pedidos de ontem; hoje e cancelado fora)","R$ 3,00" in body,re.findall(r"R\$\s?[\d.,]+",body))
    F_.reload();F_.wait_for_selector("text=Loja bloqueada",timeout=10000)
    T("funcionário também fica bloqueado (sem botão de pagar)","Já paguei" not in F_.inner_text("body"))
    r=C.evaluate("PA.setPedido(9003,{loja:'%s',uid:PA.uid,cli:'x',tt:10,v:10,st:'novo',criadoEm:Date.now()}).then(()=>'criado').catch(e=>'negado')"%slug)
    T("servidor recusa pedido de loja vencida (>33 dias)",r=="negado",r)
    # ---------- Entregador ----------
    cM=ctx("mot@x.com","Moto");M=page(cM,"/motoboy.html");login(M)
    M.wait_for_selector("#pa-ac",timeout=8000);M.click("#pa-ab");M.wait_for_timeout(300);T("sem marcar o aceite o entregador não entra",M.locator("#pa-ac").count()==1);M.check("#pa-ac");M.click("#pa-ab");M.wait_for_timeout(800)
    T("entregador sem aceite não passa; aceite grava",M.locator("#pa-ac").count()==0)
    T("aceite gravado na conta",(admin()["db"]["contas/u-mot_motoboy"].get("aceite") or {}).get("plano")=="gratis")
    b.close()
log=admin()["log"]
print("\n--- NEGADOS PELO SERVIDOR (esperados: 4 intencionais + loja pendente + vencida + 3 de segurança) ---")
for l in log:print(l)
print("\n--- ERROS DE CONSOLE/PÁGINA ---")
seen=set()
for e in ERR:
    k=e[2][:90]
    if k in seen:continue
    seen.add(k);print(e)
ok=sum(1 for _,c in R if c);print("\nRESULTADO: %d/%d"%(ok,len(R)))
