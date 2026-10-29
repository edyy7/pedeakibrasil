# PedeAí Brasil · v5.0 (teste real) — leia a seção v5.0 no fim; o resto é histórico da v4

## Colocar no ar (15 min)
1. **Firebase Console** → projeto `delivery-67d14`:
   - *Firestore Database* → criar banco (modo produção).
   - *Authentication* → Método de login → ativar **Google**.
   - *Firestore → Regras* → colar o conteúdo de `firestore.rules` → Publicar.
2. **Vercel** (ou Netlify): arraste esta pasta inteira. Anote o endereço (ex.: `meu-projeto.vercel.app`).
3. Firebase → *Authentication → Configurações → Domínios autorizados* → adicionar `pedeakibrasil.vercel.app` (e `delivery-67d14.firebaseapp.com`, que já vem por padrão).
   - Se for usar login com Google no futuro: no Google Cloud → *Credenciais → ID do cliente OAuth (Web)* → em *URIs de redirecionamento autorizados* deixe `https://delivery-67d14.firebaseapp.com/__/auth/handler` (o `authDomain` do código é `delivery-67d14.firebaseapp.com`) e em *Origens JavaScript autorizadas* `https://delivery-67d14.firebaseapp.com` e `https://pedeakibrasil.vercel.app`. Confira que o projeto selecionado no Google Cloud é o mesmo `delivery-67d14`.
4. (Recomendado) Google Cloud → *Credenciais* → restringir a chave de API ao seu domínio.
5. Abra `/cliente.html`, `/lojista.html`, `/motoboy.html`: a faixa no topo deve mostrar **● Online · sincronizado**. No Chrome do celular, use o botão “📲 Baixar e instalar”.
6. APK (opcional): pwabuilder.com → cole o link de cada app → Android.

## O que já funciona de verdade (testado com simulador do Firestore)
- Cliente faz pedido → Loja recebe na hora (com aviso) → aceita/prepara/pronto/envia → Motoboy vê a corrida → aceita (só 1 motoboy fica) → retira com código → entrega com código ou foto → Cliente acompanha cada etapa.
- Cancelamento do cliente, cancelamento do Pix após 10 min sem confirmação, descarte e “volta” pela loja.
- Cardápio, esgotado, entrega ligada/desligada e loja fechada: da Loja para o Cliente.
- Cliente reporta problema → aparece em Ocorrências no ADM (marcar resolvida/repassar).

## O que ainda NÃO está ligado (continua exemplo)
- Login real, cadastro de lojas/entregadores, planos, Pix das lojas, mensagens e o app Criador (só mostram dados de exemplo).
- Foto do motoboy: o botão registra “enviou foto”, mas não envia imagem (precisa do Firebase Storage).
- Chat, avaliações/gorjeta, diárias, mapa/GPS e cálculo de distância real (usa valores fixos).
- Chave Pix exibida ao cliente ainda é “chave-exemplo@pix”.
- Regras do Firestore são de piloto (qualquer app autenticado lê/escreve). Não abra ao público sem login real.


## v4.2 · Cadastro livre, período grátis e cobrança
**Como funciona**
- [v5.0: a LOJA agora só entra por link do ADM] Qualquer pessoa abre `motoboy.html` ou `adm.html`, entra com Google e já usa. Cada papel tem a sua conta e o seu período.
- O cliente **não precisa de login**: ele abre o link da loja (`/cliente.html?loja=...`) e pede.
- O lojista informa o nome da loja no primeiro acesso e recebe o **link da loja** (botão 🔗 na barra e em “Compartilhar cardápio”, com Compartilhar / WhatsApp / Copiar).
- **30 dias grátis** → depois **3 dias de carência** → **trava** (tela de pagamento, sem acesso). Para mudar os prazos: `TRIAL` e `CAR` no topo de `conta.js`.
- Pagamento: a tela mostra valor e chave Pix; a pessoa toca **“Já paguei”**; o Criador confirma e a conta ganha **+30 dias** na hora.

**Antes de abrir ao público (faça nesta ordem)**
1. Firebase → Authentication → Método de login → ativar **Google** (o Anônimo continua ligado, o cliente usa).
2. Firestore → Regras → colar `firestore.rules` → Publicar.
3. Suba a pasta na Vercel (com `vercel.json`).
4. Abra `criador.html` e entre com `edinaldooliveiradesouza@gmail.com`. É a **única** conta que acessa o Criador; qualquer outra recebe “Acesso negado” (no app e nas regras do Firestore).
5. No botão verde **💳 Contas e pagamentos** (no Criador): defina valor, chave Pix, titular e WhatsApp do suporte → Salvar. Ali você também vê todas as contas e confirma pagamentos.
6. Google Cloud / Firebase: domínios e URIs de redirecionamento conforme a seção anterior (`pedeakibrasil.vercel.app` e `delivery-67d14.firebaseapp.com`, com `/__/auth/handler`).

**Limites conhecidos (a fazer)**
- A trava agora também é no servidor: `firestore.rules` recusa **pedido novo** de loja vencida (após 30 dias + 3 de carência). Pedidos já abertos continuam podendo ser concluídos. **Teste no “Simulador de regras” do Firebase** antes de abrir ao público (não rodei emulador aqui).
- [SUBSTITUÍDO na v5.0 pelos planos] Valores por tipo (painel do Criador): Loja R$ 99,90 · Entregador R$ 0 (grátis, sem trava) · ADM R$ 299,90. Se mudar os prazos, altere `TRIAL`/`CAR` em `conta.js` **e** as constantes em `firestore.rules`.
- Entregador–loja: a loja gera um **código de convite** (Compartilhar link do motoboy). O entregador abre o link (ou cola o código em Menu → Vincular à Loja) e passa a ver só os pedidos dessa loja. O vínculo só grava com código válido (regras `convites/`). **Ainda não** há restrição de leitura de `pedidos` no servidor: o filtro é na consulta do app (um usuário técnico logado ainda poderia ler pedidos de outras lojas pela API). Um entregador vincula-se a uma loja por vez.
- O ADM, o cadastro de entregadores pelo lojista, planos, mensagens e o restante do painel Criador continuam com dados de exemplo.
- Uma pessoa pode criar outra conta Google para ganhar novo período grátis.
- Cardápio de uma loja nova começa com os itens de exemplo (edite no app).
- Regras do Firestore não foram rodadas em emulador aqui; teste o fluxo real após publicar.


## v4.6 · Loja ↔ ADM (código de indicação) e lojas reais no painel do ADM
**Como funciona**
- Cada ADM, no primeiro login em `adm.html`, ganha um **código** (ex.: `ADM-EDINALDO`) e um **link** `…/lojista.html?adm=ADM-EDINALDO` (Config → Indicação Comissionada, e na aba Lojas → “Trazer uma loja”).
- No primeiro acesso da loja (`lojista.html`) aparece **“Tem um código de ADM? (opcional)”**. Com o link, o campo já vem preenchido. Código inexistente → a loja **não é criada** e mostra o erro (evita cair no ADM errado por erro de digitação). Sem código → `admId = "padrao"` (ADM padrão: o Criador, até alguém reivindicar).
- A loja guarda `admId` (uid do ADM) e `admCodigo` em `lojas/{slug}`. Os códigos ficam em `admCodigos/{código}` → `{uid}`.
- `adm.html` lista só as lojas com `admId == uid do ADM logado`, com: faturamento real (pedidos entregues/retirados; 30 dias e total), pedidos de hoje, estado do plano (Ativa / A vencer / Carência / Travada, calculado da conta do lojista), **mudar vencimento** e **suspender/reativar**.
- Loja suspensa: o app da loja mostra tela de bloqueio, o cliente vê “fechada” e o servidor recusa pedido novo.
- Vencimento pelo ADM: no máximo **2 alterações**, até **+5 dias** da data original (= 35 dias da entrada no período grátis), nunca para o passado. Quando o Criador confirma um pagamento (“Confirmar +30 dias”), o contador do ADM zera.

**Segurança (`firestore.rules`) — publicar de novo**
- ADM só **lista** lojas com `admId == uid`; só **altera** `suspensa/suspEm` dessas lojas; só altera `venc/admAlt/vencBase` das contas dessas lojas (com os limites acima).
- A loja **não consegue** mudar o próprio `admId` nem se reativar (`suspensa`). O Criador altera tudo.
- `admCodigos`: um código por ADM, não dá para listar, não dá para sobrescrever.
- **Teste no “Simulador de regras” / emulador antes de abrir ao público** (não rodei emulador aqui, só revisei a sintaxe).

**Limites conhecidos**
- Lojas criadas antes da v4.6 não têm `admId`: não aparecem para nenhum ADM (só para o Criador). Para vincular, edite o documento em `lojas/{slug}` no console e coloque `admId` = uid do ADM.
- `pedidos` e `ocorrencias` continuam legíveis por qualquer app logado (regra de piloto). O painel do ADM só **mostra** as suas lojas; o bloqueio no servidor para esses dois ainda não existe.
- Abas Pix, Mensagens, Acessos e o resto de Config continuam de exemplo. A aba Pix ficou vazia (os exemplos dependiam de lojas fictícias). O tile “entregadores aprovados” saiu do Painel (ainda não há fonte real).
- O botão “Habilitar Serviço de Entrega” virou só informação: quem liga/desliga a entrega é a loja (o ADM vê o estado).


## v4.7 · Pedidos só para quem participa
- **Ler** um pedido: o cliente que pediu (`uid`), o motoboy que aceitou (`mot`), o dono da loja (`lojas/{loja}.dono`), o ADM dessa loja (`admId`), motoboys vinculados à loja (só ela) e o Criador. Não foi preciso criar `clienteUid/lojaUid/motoboyUid`: os campos que já existiam bastam.
- **Alterar**: cliente (no pedido dele), dono da loja, motoboy dono da corrida, e o motoboy vinculado **só para pegar** corrida livre (grava apenas `mot/motN`, com ele mesmo). ADM só lê. **Apagar**: Criador ou dono da loja.
- Os apps já consultam com `where('loja','==',…)` / `where('mot','==',uid)`; qualquer consulta nova de pedidos precisa seguir isso, senão o Firestore recusa.
- **Teste de verdade antes de abrir:** (1) cliente faz e acompanha o pedido; (2) loja recebe e vai até “enviado”; (3) motoboy vinculado vê e aceita; (4) motoboy de OUTRA loja não vê nada; (5) ADM vê o faturamento da loja dele; (6) cancelamento do Pix após 10 min (confira quem dispara: se for um app que não seja cliente/loja/motoboy da corrida, será recusado).
- `ocorrencias` continuam abertas (regra de piloto).


## v4.8 · Instalar todos os perfis
- Cada app agora tem o **próprio escopo** no manifest (`scope: ./adm.html`, `./lojista.html` etc.). Antes todos usavam `./` e, depois de instalar 1 ou 2, o Chrome deixava de oferecer a instalação dos outros por achar que a página já pertencia a um app instalado.
- **Em aparelhos que já instalaram a versão anterior:** desinstale os apps do PedeAí da tela inicial, abra o link de cada perfil no Chrome e instale de novo. Se o botão “Baixar e instalar” ainda não abrir a instalação, use o menu ⋮ do Chrome → “Instalar app”.
- Instale cada perfil abrindo o link **do próprio perfil** (`/lojista.html`, `/motoboy.html`, `/adm.html`, `/cliente.html`, `/criador.html`), não a partir de outro app já instalado.


## v5.0 · Planos, D-1, hierarquia da loja e RH (pacote de homologação)
**Ordem para subir:** 1) Firebase → Firestore → Regras: colar `firebase/firestore.rules` → Publicar. 2) Vercel: subir a pasta `app/`. 3) Firebase → Authentication → Domínios autorizados: o novo domínio da Vercel. 4) `criador.html` com seu e-mail → 💳 Contas e pagamentos → conferir **Taxa de serviço (R$ 1,00)**, Pix, titular e WhatsApp → Salvar.

**Regras aplicadas**
- Planos da loja: Iniciante (sem mensalidade) · Mensal R$ 199,90 · Anual R$ 1.999,00 · 3 anos R$ 4.799,00 · 5 anos R$ 7.199,00. ADM: Iniciante ou Mensal R$ 299,90. Plano pago = isento de R$ 1,00 e 0,5%.
- Ciclo: 30 dias + 3 de carência; trava no 34º dia (`TRIAL`/`CAR` em `conta.js`). Trava Total: só a tela de pagamento.
- D-1: fatura = pedidos do ciclo até ontem (hoje vai para o próximo). Loja Iniciante: Σ taxa de serviço (R$ 1,00 por pedido do link). ADM: 0,5% das vendas avulsas (balcão) das lojas Iniciante dele.
- Cliente: linha "Taxa de Serviço" só se a loja for Iniciante; valor global no Criador.
- Loja criada **só pelo ADM** (💳 → 👥 RH → Nova loja, escolhe o plano antes do link). 1º login Google pelo link `lojista.html?gerente=…` vira Gerente; o link vale uma vez.
- Equipe: Gerente cadastra e-mail (pendente) → funcionário cai na sala de espera → ADM escolhe cargo e autoriza (aviso na hora no ADM).
- ADM: cargos/salários, Folha de Pagamento Mensal e "Exportar PDF" (janela de impressão → Salvar como PDF).
- Entregador: Login Google + aceite do Plano Grátis; vínculo por código; só vê corridas da loja.
- Servidor: pedido novo recusado se loja vencida/suspensa/sem gerente; funcionário só acessa após `equipe.st = ativo`, que só o ADM altera.

**Limites conhecidos (ver dossiê)**: regras não rodaram em emulador; leitura de `lojas/{slug}` por código exato segue aberta a qualquer login (o cliente precisa do cardápio); todos os cargos veem as mesmas telas da loja (cargo é só cadastro/folha); lojas criadas na v4 viram plano Iniciante.
