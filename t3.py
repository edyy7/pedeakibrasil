import json,re,urllib.request
from playwright.sync_api import sync_playwright
from fb import *
BASE="http://localhost:8765"
db=json.load(urllib.request.urlopen(BASE+"/__dump"))["db"]
ini=[k.split("/")[1] for k,v in db.items() if k.startswith("lojas/") and v.get("plano")=="iniciante"][0]
pago=[k.split("/")[1] for k,v in db.items() if k.startswith("lojas/") and v.get("plano")=="anual"][0]
res=[]
with sync_playwright() as p:
    b=p.chromium.launch()
    for nome,slug in (("INICIANTE",ini),("ANUAL",pago)):
        c=b.new_context(service_workers="block",viewport={"width":390,"height":800})
        c.route("https://www.gstatic.com/**",lambda r:r.fulfill(status=200,content_type="text/javascript",body=APP_JS if "firebase-app" in r.request.url else FS_JS if "firestore" in r.request.url else AUTH_JS))
        pg=c.new_page();pg.goto(BASE+"/cliente.html?loja="+slug);pg.wait_for_function("window.PA&&PA.ready");pg.wait_for_timeout(1000)
        pg.evaluate("MKT=true;X=X0;cart=[{n:'Teste',p:20}];tipo='ret';draw()")
        pg.wait_for_timeout(200)
        # procura a tela de revisão/checkout
        info=pg.evaluate("""()=>{const o={};try{o.TS=TS;o.cart=cart.length}catch(e){};o.btns=[...document.querySelectorAll('button')].map(b=>b.innerText.trim()).filter(t=>/pedido|finaliz|revis|carrinho|ver /i.test(t)).slice(0,6);return o}""")
        print(nome,info)
        for t in info.get("btns",[]):
            if re.search(r"carrinho|ver |revis",t,re.I):
                pg.click("text="+t.split("\n")[0]);pg.wait_for_timeout(400);break
        txt=pg.inner_text("body").replace("\xa0"," ")
        print(nome,"tem 'Taxa de Serviço':","Taxa de Serviço" in txt, "| trechos R$:",re.findall(r"R\$ ?[\d.,]+",txt)[-6:])
        pg.screenshot(path="/home/claude/h/ck_%s.png"%nome)
        c.close()
    b.close()
