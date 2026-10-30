import json,re,urllib.request
from playwright.sync_api import sync_playwright
from fb import *
BASE="http://localhost:8765"
def admin(**k):
    r=urllib.request.Request(BASE+"/__admin",json.dumps(k).encode(),{"content-type":"application/json"});return json.load(urllib.request.urlopen(r))
d=admin()["db"];ger=d["contas/u-ger_lojista"];slug=ger["loja"]["slug"]
# gerente pede pagamento do plano Anual (simula o botão "Já paguei")
admin(set={"contas/u-ger_lojista":dict(ger,pagto={"st":"analise","em":1,"valor":1999,"plano":"anual"})})
with sync_playwright() as p:
    b=p.chromium.launch();c=b.new_context(service_workers="block",viewport={"width":390,"height":900})
    c.add_init_script("window.__NEXT_USER=%s"%json.dumps({"uid":"u-criador","email":"edinaldooliveiradesouza@gmail.com","displayName":"Criador","email_verified":True}))
    c.route("https://www.gstatic.com/**",lambda r:r.fulfill(status=200,content_type="text/javascript",body=APP_JS if "firebase-app" in r.request.url else FS_JS if "firestore" in r.request.url else AUTH_JS))
    pg=c.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:200]))
    pg.goto(BASE+"/criador.html");pg.wait_for_selector("#pa-g");pg.click("#pa-g");pg.wait_for_function("window.PA&&PA.ready",timeout=8000);pg.wait_for_timeout(800)
    print("botões:",pg.evaluate("[...document.querySelectorAll('button')].map(b=>b.innerText.trim()).filter(Boolean).slice(0,14)"))
    pg.click("text=💳");pg.wait_for_timeout(1200)
    t=pg.inner_text("body").replace("\xa0"," ");print("painel tem taxa:", "Taxa de serviço" in t, "| confirmar:", bool(re.search("Confirmar",t)))
    print(re.findall(r"R\$ ?[\d.,]+",t)[:8])
    # taxa global
    pg.fill("#cts","2.5");pg.click("text=Salvar");pg.wait_for_timeout(800)
    print("config:",admin()["db"].get("meta/config",{}).get("taxaServico"))
    # confirmar pagamento
    pg.click("text=💳") if pg.locator("#cts").count()==0 else None
    pg.wait_for_timeout(500)
    if pg.locator("text=Confirmar").count():
        pg.click("text=Confirmar");pg.wait_for_timeout(1000)
    d=admin()["db"];g=d["contas/u-ger_lojista"];print("conta:",{k:g.get(k) for k in("plano","venc","pagto")});print("loja plano:",d["lojas/"+slug].get("plano"))
    print("venc em dias:",round((g.get("venc",0)-admin()["now"])/86400000,1))
    print("erros:",errs)
    b.close()
print([l for l in admin()["log"] if l.get("user","")and "edinaldo" in str(l.get("user"))])
