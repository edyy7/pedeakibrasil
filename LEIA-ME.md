# PedeAí Brasil · v6.0.0

**Novo na v6.0.0:** Marketplace removido; entregador sem vínculo só vê “Vincular à Loja”; Diárias reais (`app/diarias.js`, bloco `diarias` no `firestore.rules`, aviso de cancelamento em `api/push.js`). **NÃO publique o `firestore.rules` antes de rodar o emulador** (`cd firebase/teste-rules && npm install && npm test`, 6 testes novos de diárias). Testes do navegador: `sh docs/teste-navegador/rodar-tudo.sh` (t21_diarias.py e t21_push.js novos).

---

# (base) v5.9.0 (P0 do handoff)

## Publicar (nesta ordem)
1. Firebase → Firestore → Regras → colar `firebase/firestore.rules` → Publicar.
2. Vercel: subir a pasta `app/` (inclui `api/push.js`).
3. Push (opcional até ter a chave): Firebase Console → Configurações do projeto → Cloud Messaging → Certificados push da Web → gerar par de chaves → colar a chave pública em `PA_VAPID` na seção v5.9.0 de `app/conta.js`. Na Vercel, variável `FIREBASE_SERVICE_ACCOUNT` (a mesma do Asaas).
4. Regras no emulador: `cd firebase/teste-rules && npm install && npm test` (precisa de internet e Java).

## O que mudou
- Valor do pedido conferido no servidor: o cliente grava `itens:[{i,q}]`; a regra soma pelo cardápio `lojas/{slug}.m` e recusa total menor que a soma (ou maior que soma + R$ 200), item esgotado, quantidade fora de 1–50, mais de 12 itens. Cliente não altera v/itens/loja depois. Criar pedido: só cliente (uid dele), dono ou equipe ativa.
- Correção: o cardápio agora é gravado como lista de mapas (Firestore não aceita array dentro de array).
- lojaDados amarrado à própria loja; coleções `tokens/{uid}` e `pushLog`.
- Offline: cache persistente do Firestore; sem internet o pedido usa id local de 8 dígitos e fica na fila do aparelho.
- Push FCM: `api/push.js` + handler no `sw.js` + registro de token em `conta.js`.

## Não verificado
- Regras reais no Emulador: teste escrito, NÃO executado (sem rede no build).
- Push e offline em aparelho real: não testados.
- Simulador: 12 de lógica + 20 scripts de navegador (incl. novo t20_p0) passando.

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


## v5.1 · Bloco 1 — sincronização de 5 s e avisos básicos
- **Sincronização:** `conta.js` ganhou `PA_sync5`, que envolve o Firestore dos 5 apps (cliente, lojista, motoboy, adm, criador). Cada consulta que o app já fazia (mesmo escopo do perfil) é relida do servidor a cada 5 s e só repassada ao app se mudou. Nenhuma consulta nova foi criada para esse fim.
- **Avisos:** Loja é avisada quando entra pedido novo; Motoboy (vinculado à loja, e online) é avisado quando um pedido de entrega fica **pronto**. Vibração + bipe + notificação do sistema (o navegador pede permissão no primeiro toque).
- Motoboy: nova consulta `pedidos where st==pronto and loja==<loja vinculada>` (mesma forma da consulta de "enviados"; as regras atuais já permitem).
- `sw.js`: versão de cache `pedeai-v5.1.0` e clique na notificação abre o app.
- Limite: com o app totalmente fechado não chega aviso (isso exigiria push por servidor/FCM, fora deste bloco).


## v5.2 · Parte 1 — Fase 1 (limpeza de teste, relatórios reais, limite 15/dia, Criador oculto)
**Corrigido**
- **cliente.html**: apagado (não oculto) o bloco "Opções de teste" com seus botões (Entrega grátis, Assistente, Marketplace, raio) e a frase "Neste exemplo as fotos são ícones". Removidas as 4 lojas fictícias do Marketplace (`MKS=[]`) e o assistente de voz simulado ficou desligado. A entrega/retirada continua vindo da configuração real da loja.
- **adm.html**: botões do relatório agora reais — gera PDF (jsPDF via cdnjs) com resumo e balanço por loja; Visualizar, Imprimir, Salvar em PDF, Compartilhar (Share nativo, com arquivo) e Enviar ao contador (Share com arquivo ou, sem suporte, salva o PDF e abre o e-mail). Apagados os textos "15 pedidos/dia".
- **lojista.html**: Exportar backup (.json real, também compartilhável) e Restaurar backup (valida app, tipo e loja; restaura cardápio, horários e caixa; pedidos não são sobrescritos). O texto "criptografado" foi removido porque o arquivo não é criptografado.
- **criador.html**: removida toda a regra/tela "15 pedidos/dia" (estados Limitada/Limite atingido, botão Liberar/Travar loja).
- **index.html / PedeAi.html**: botão do Criador removido da tela inicial. Acesso oculto: caminho `/criador` (rewrite em `vercel.json`) ou, no celular, 5 toques no título "PedeAí Brasil" → campo → digitar `criador`. O login do Criador continua restrito ao e-mail autorizado (app + regras).
- `sw.js`: cache `pedeai-v5.2.0`.

**Ainda não feito (partes seguintes)** — textos/botões "Exemplo:" que não fazem parte da Fase 1: endereço do cliente fixo, chave Pix "chave-exemplo", chats (cliente/loja/motoboy/ADM), cadastro e tema do motoboy, e as telas do Criador/ADM que ainda usam dados fictícios (lojas, Pix, mensagens, ocorrências de exemplo). Fases 2 a 4 não iniciadas.
**Teste:** sintaxe dos 5 apps validada e fumaça em navegador (sem erros JS, bloco de teste ausente, acesso oculto funcionando). A geração do PDF depende da internet (cdnjs) e não foi exercitada aqui; teste no aparelho.


## v5.2.1 · Parte 2 — Blocos 2, 3 e 4 (publique `firebase/firestore.rules` de novo!)
**Bloco 2 · Som e Criador**
- Aviso com som, vibração e notificação do sistema (`silent:false`, `requireInteraction`) agora também no ADM e no Criador (pede permissão no 1º toque).
- Quando o ADM cria uma loja (👥 RH → Nova loja) grava `eventos/{slug}`; o Criador recebe aviso sonoro na hora e vê a lista em **🏪 Lojas e dados** (botão vermelho), com "Marcar como vista".
- Limite: com o app **totalmente fechado** só chega aviso com push de servidor (FCM + Cloud Function), que não está neste pacote.

**Bloco 3 · Zerar e Excluir (no Criador, dados reais)**
- **Zerar** (digitar ZERAR): apaga `pedidos` (vendas e lucros), `ocorrencias`, `eventos`, o histórico de pagamentos já decididos em `contas.pagto` (carteira, inclusive a do Criador; pagamentos "em análise" ficam) e reinicia o contador de pedidos. **Preserva** contas, lojas, equipe, cargos e cardápios.
- **Excluir loja** (digitar o nome): apaga pedidos, ocorrências, equipe, convites, eventos e a loja; apaga a conta do dono e desvincula os entregadores dela.

**Bloco 4 · Equipe e salário**
- Formulário do Gerente na ordem **Nome, Cargo, E-mail** + **Salário** (decimal). O ADM vê nome/cargo/salário informados, o cargo já vem pré-selecionado e o salário vira o da folha (se vazio, vale o do cargo).
- Alterar `salario`: **ADM** (botão Salário na folha) e **Gerente** (botão Salário na equipe), validado nas regras (número ≥ 0). O Gerente não consegue mudar `st`/cargo oficial.

**Regras novas**: `eventos` (ADM cria só o próprio; só o Criador lê/edita/apaga); Criador pode listar/apagar `convites`, `gerenteConvites`, `contas` e `lojas`; `equipe` aceita `nome`, `cargoInformado`, `salario`.
**Não testado em emulador/produção**: regras do Firestore (só conferi chaves/parênteses) e as telas Zerar/Excluir (só sintaxe). Teste primeiro com uma loja descartável.
**Ainda mock**: a tela antiga do `criador.html` (botão "Zerar" e lojas de exemplo) não foi religada; o painel real é o das duas bolhas flutuantes.


## v5.3.0 · Parte 3 — Blocos 5, 6, 7 e 9 (republique `firestore.rules` e publique `storage.rules`!)
**Bloco 5 · Pedidos e preparo (lojista)**
- Fluxo: Novo → **Aceitar** (status "Aceito", baixa o estoque) → **Solicitar preparo** ("Em preparo" + abre a **OS em fonte grande**, com botão Imprimir) → **Liberado (cozinha)** (só marca aviso interno, não muda o status) → **Pronto** (único que dispara o aviso/visibilidade ao entregador; segue valendo o envio da loja).
- **Histórico (timeline)** abaixo de cada pedido: botão "🕒 Histórico do pedido" com cada etapa, data/hora e quem fez (campo `hist` no pedido). Mudanças feitas pelo entregador/cliente ainda não entram no histórico.
- Cliente: status "Aceito" aparece como "Loja aceitou e está preparando".

**Bloco 6 · Cadastro do entregador**: formulário real (sem dados de exemplo) com **Rosto, CNH e Veículo obrigatórios** (foto pela câmera/galeria, reduzida a 1280px e enviada ao Firebase Storage em `entregadores/{uid}/`). Enquanto o cadastro estiver incompleto o app trava na tela de cadastro. Salvo em `contas/{uid}_motoboy.cad`.

**Bloco 7 · Pagamentos (Criador)**: botão azul **🔗 Pagamentos** com CRUD de links (https obrigatório), "Usar este" e **Switch** de redirecionamento. Dados: `linksPagamento/*` (só Criador) e `meta/pagamento` (lido pelo cliente). Com o Switch ligado, o cliente que escolhe **Pix** é levado ao link logo após enviar o pedido (o pedido já fica registrado).

**Bloco 9 · Menu Garçom**: aba **🍽️ Garçom** (cardápio, Nome do cliente, Mesa e Observações, todos opcionais) que envia o pedido à cozinha (aparece como "Mesa N", com garçom e observação, também na OS). Alternância **🔄 Modo Garçom / Modo Loja** para Gerente e funcionários; quem tem cargo "Garçom" fica travado no modo Garçom (só Garçom + Pedidos). Equipe ganhou `commission_active` (boolean) e `commission_percentage` (0–100): switch e % aparecem no cadastro quando o cargo é Garçom; botão **Comissão** para Gerente e ADM editarem; o garçom vê suas vendas e comissão. O garçom precisa sair e entrar de novo para ver mudança de comissão.

**Antes de usar**: (1) publicar `firebase/firestore.rules`; (2) publicar `firebase/storage.rules` no Storage (ative o Storage no console) **trocando COLOQUE-O-E-MAIL-DO-CRIADOR-AQUI pelo e-mail do Criador**; (3) o link de pagamento é um redirecionamento: a confirmação do pagamento continua manual pela loja.
**Testado em navegador**: fluxo aceitar→preparo→OS→liberado→pronto, timeline, aba Garçom/comissão/pedido com mesa, cadastro do entregador (3 fotos obrigatórias, sem "Cancelar" quando forçado), formulário de equipe. **Não testado**: upload real ao Storage, regras do Firestore/Storage, painel 🔗 Pagamentos e o redirecionamento no checkout (precisam do Firebase).
**Fica para depois**: Bloco 8 não existe no documento; Fases 3 e 4 (app de entregas, site) e o aviso com app fechado.


## v5.3.1 · Auditoria de erros e incoerências (corrige o v5.3.0)
**Bugs corrigidos**
- A loja **sobrescrevia** o liga/desliga de entrega do ADM (gravava `ent:true` sempre). Agora a loja só lê o flag do ADM.
- Endereço do cliente era fixo ("Rua das Flores, 120") em todo pedido. Agora o cliente informa rua/bairro (e GPS opcional), o endereço vai no pedido e é exigido para entrega.
- Código de retirada/entrega `1234` e dica "use 1234" removidos; pedido de mesa e pedido sem código têm botão "Entregue na mesa / ao cliente".
- Modo Garçom estava escondido no fim da barra de abas: agora a aba **🍽️ Garçom** fica logo depois de Pedidos.
**Dados de teste / botões falsos removidos**
- Loja: painel "Troque acima para ver como a loja muda…" (simulação de entrega/vencimento), chat fictício "Carlos P. / fora do raio", conversas e chats de mentira, "Simular: um motoboy aceitou", assistente de voz simulado, "Leitura de notificação Pix" e "Falar com o ADM" (não enviavam nada), motoboys, pedidos e assistente "Lariquinha" de exemplo.
- Cliente: chat de mentira, chave Pix "chave-exemplo" (agora a loja cadastra a chave em Gestão → 💠 Chave Pix, e o cliente copia de verdade).
- ADM: mensagens/autorizações/ocorrências de exemplo, cards de Pix e Cadastro fictícios, "Simular: o Criador confirmou", chat de mentira.
- Motoboy: nome "João (exemplo)", diárias de exemplo, chat de mentira, "tema escuro" e "Excluir minha conta" (não faziam nada). Os interruptores de aviso e som agora gravam e valem de verdade.
- Criador: a tela com lojas/Pix/mensagens inventadas virou um painel real com 3 botões (💳 Contas, 🏪 Lojas e dados, 🔗 Links de pagamento).
**Cache**: `pedeai-v5.3.1`.
**Pendente (não implementado)**: chats reais (cliente/loja/entregador/ADM), "enviar só para um entregador escolhido" (precisa listar entregadores reais), avaliação do cliente (não é gravada), foto de entrega do motoboy, e todo o app de entregas e o site (Fases 3 e 4).


## v5.4.0 · Escopo Fase 1 (6 itens) — entregas ficam fora desta versão
**1. Painel do Criador · Módulos e preço**: botão "🧩 Módulos e preço por loja". Liga/desliga Gestão (R$ 49), Loja Virtual (R$ 50) e Agendamento (R$ 30) por loja; o total muda na tela; botão "i" explica cada módulo. Grava `lojas/{slug}.modulos` e `valorModulos`. Só o Criador altera (o dono é bloqueado nas regras).
  - Lojas antigas sem `modulos`: Gestão e Loja Virtual ligadas, Agendamento desligado.
  - Gestão desligada esconde Caixa, Histórico, Gestão e Equipe. Loja Virtual desligada esconde Compartilhar e bloqueia pedidos no cliente. Pedidos, Produtos e Garçom ficam sempre.
**2. App de Gestão**: sincronização em tempo real (Firestore `onSnapshot`, mais rápida que 5 s) e aviso sonoro de pedido novo já existiam. Equipe com Nome, Cargo, E-mail e Salário (ADM e Gerente editam). Fluxo Solicitar preparo → Liberado (cozinha) → Pronto e Menu Garçom (nome, mesa, observações) já estavam implementados.
**3. Loja Virtual**: link público `cliente.html?loja=SLUG`, sem app. Checkout simplificado: o cliente vê Entrega e Total; se não houver taxa, aparece "Frete Grátis"; se houver, aparece "Incluída no total". Para voltar à conta detalhada: `checkoutSimples: false` em `lojas/{slug}.brand`.
  - **Pix com split (Asaas)**: se a loja tiver `asaasWalletId`, o Pix do pedido é gerado no servidor (`/api/asaas`) com split: a loja recebe (100 − CRIADOR_PERCENT)% e o Criador o resto. O webhook `/api/asaas-webhook` marca o pedido como pago.
**4. Agendamento**: aba **Agenda** na loja (bio, foto, 3 formas de pagamento, chave Pix, horário, intervalo, serviços, lista de agendamentos com "Recebi o Pix" e "Cancelar"). Mini-site público `agendar.html?loja=SLUG` (exige login Google). Horário único por ID (`loja__data__HHMM`) e registro público `ocupados` sem dados pessoais.
  - Opção 1 (Pix automático): usa `/api/asaas` + webhook. Opção 2 (Pix direto): cliente paga na chave, a loja confirma. Opção 3: grátis, paga no local.
**5. Marca**: cor principal (texto preto ou branco pelo contraste WCAG, automático) e logo (horizontal centralizado, vertical à esquerda). Arquivos: `app/marca.js`, Storage `lojas/{slug}/`.
**6. Site**: `app/site.html` com apresentação dos módulos e os botões "Quero criar um site personalizado" e "Quero ser dono do meu próprio APK", ambos com formulário (Nome, Telefone, E-mail, Mensagem) que grava em `leads`. O Criador vê os contatos em "📩 Leads do site". O índice ganhou o link "Conheça o sistema".

**Variáveis de ambiente (Vercel, projeto em `app/`)**
- `FIREBASE_SERVICE_ACCOUNT` (JSON da conta de serviço do Firebase)
- `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, `CRIADOR_PERCENT` (ex.: 10), `ASAAS_SANDBOX` ("1" para testar)
- No painel do Asaas, cadastre o webhook em `https://SEU-DOMINIO/api/asaas-webhook` com o mesmo token.

**Antes de usar**
1. Publicar `firebase/firestore.rules` e `firebase/storage.rules` (ative o Storage). O e-mail do Criador já está correto nos dois.
2. Criar o índice automático que o Firestore sugerir no console, se aparecer erro de índice na listagem de agendamentos.
3. Cadastrar a conta de recebimento Asaas de cada loja (walletId) em Agenda → "ID de recebimento Asaas".

**Limitações conhecidas**
- O valor do pedido ainda é calculado no navegador e gravado no pedido. O servidor cobra esse valor. Para impedir alteração de preço, o cálculo precisa ir para uma Cloud Function (não feito).
- O cadastro de leads é público (sem login), com validação de tamanho e tipo nas regras. Pode receber spam; se acontecer, exija login ou adicione reCAPTCHA.
- Avaliação do cliente ainda não é gravada (mostra só a mensagem).
- Entregas (app do motoboy) fora desta versão, conforme combinado.
- Não testado com Firebase/Asaas reais (sem rede aqui): regras, webhook e cobrança precisam de teste no ambiente de vocês (usar `ASAAS_SANDBOX=1` primeiro).

## v5.4.2
- Leads do site: ao abrir "📩 Leads do site", os contatos novos são marcados como lidos e o contador deixa de contar os já vistos.

## v5.4.3
- Regras do Firestore: removido o fatiamento de texto nas regras de `ocupados` e `agendamentos` (trocado por `split`), para não correr risco de erro ao publicar.

## v5.4.3 · validação (30/10/2026)
- Sem mudança no app. Testes em `docs/teste-navegador/` atualizados para a interface atual e novo `t5_fumaca.py` (9 telas). Para rodar tudo: `sh rodar-tudo.sh` dentro de `docs/teste-navegador` (precisa de node, python3 e playwright/chromium). Resultado desta validação: lógica 10/10 · cenário 29/29 · checkout 2/2 · Criador (taxa, pagamento, leads) ok · fumaça 9/9. Detalhes e limites no dossiê, seção 3c.

## v5.4.4 · novo site de divulgação
- `app/site.html` reescrito: foco na dor de cada perfil, vantagens e botões de instalar. APK próprio: preencha `DL.<perfil>.apk` no início do script da página. Formulário de leads inalterado. `sw.js`: `pedeai-v5.4.4`. Novo teste `docs/teste-navegador/t6_site.py` (9 checagens), incluído em `rodar-tudo.sh`.

## v5.4.5 · Zerar também zera o Criador
- `conta.js`: "Zerar agora" passa a apagar também os Leads do site e os pagamentos em análise (além dos decididos). Preços, Pix, links de pagamento, contas e lojas continuam. `sw.js`: `pedeai-v5.4.5`. Novo teste `docs/teste-navegador/t7_zerar.py` (9 checagens), incluído em `rodar-tudo.sh`.


## v5.4.6 · App próprio do Garçom
- Novo perfil **`app/garcom.html`** (com `manifest-garcom.json` e `icon-garcom-192/512.png`, escopo próprio, instalável separado). Abre direto na aba **🍽️ Garçom** (Nome do cliente, Mesa e Observações opcionais, cardápio, envio à cozinha, comissão) e na aba **Pedidos**. Sem Produtos, Caixa, Gestão, Equipe nem "Modo Loja".
- Login: o mesmo do funcionário (Google). O ADM/gerente cadastra o e-mail em Equipe e o ADM autoriza com o cargo **Garçom**; nada muda em `conta.js`, regras do Firestore ou nos outros perfis. A aba Garçom dentro do Lojista continua como estava.
- Entrada "🍽️ Garçom" em `index.html` e `PedeAi.html`. `sw.js`: `pedeai-v5.4.6`. Novo teste `docs/teste-navegador/t8_garcom.py` (6 checagens), incluído em `rodar-tudo.sh`; `t5_fumaca.py` agora cobre 10 telas.
- **Funcionário agora tem Nome, E-mail e Telefone/WhatsApp** (obrigatório, com DDD) no cadastro de Equipe da loja; aparece na lista da loja e na tela de autorização do ADM. **Republique `firebase/firestore.rules`** (campo `telefone` liberado em equipe) ou o cadastro será recusado.
- Resultado: lógica 10/10 · cenário 30/30 · checkout 2/2 · fumaça 10/10 · site 9/9 · zerar 9/9 · garçom 6/6 · pedido do garçom até a loja 6/6 (`t9_garcom_pedido.py`: lança mesa 7 com observação, grava no servidor, a loja recebe).
- Ainda não feito: APK próprio do garçom (usar pwabuilder no link `/garcom.html`) e testar com celular real.

## v5.4.6 · Vagas de entregadores e vínculo protegido
- Lojista → Compartilhar → "Compartilhar link do motoboy": novo quadro **🛵 Vagas de entregadores** (campo de quantidade, "ocupadas X de Y", aviso COMPLETO e a lista de entregadores que entraram). Sem número definido = sem limite.
- Entregador: ao confirmar o código, ocupa uma vaga; se estiver cheio, vê "Vagas de entregador desta loja esgotadas" e não entra. "Gerar novo código" mantém vagas e lista.
- **Segurança (firestore.rules, republicar):** o servidor agora também barra o limite (não depende da tela) e fechei uma brecha: antes um entregador conseguia se vincular a qualquer loja sem convite; agora só pelo código válido (e dentro das vagas).
- Testes novos `t10_vagas.py` (9 checagens: salvar vagas, 1º entra, 2º barrado, burla direta negada, vincular sem convite negado, passar do limite negado, lista na loja, aumentar vagas libera). Suíte: lógica 10/10 · cenário 30/30 · checkout 2/2 · fumaça 10/10 · site 9/9 · zerar 9/9 · garçom 6/6 · pedido do garçom 6/6 · vagas 9/9.
- Ainda NÃO existe neste pacote: chave "Motoboys globais" no Criador, card "Total de Motoboys", aprovação do entregador pelo lojista, e o APK.

## v5.4.7 · Comando PedeAki (módulos, site, checkout e regras do entregador)
Alterado SOMENTE o que o comando listava; o resto do pacote ficou igual.
- **Criador (`conta.js`, 🧩 Módulos e preço por loja):** Gestão R$ 49 agora é travada (sempre ligada, 🔒); Loja Virtual R$ 50 e Agendamento R$ 30 ligam/desligam; o **total da loja aparece no topo do cartão** e muda ao ligar os módulos; botão "i" explica cada módulo.
- **Site (`site.html`):** botão **Acesso Criador** no menu (abre `criador.html`); nova seção **Escolha a sua solução** com os 4 cards (Gestão com Loja Virtual, Entrega/Motoboy, Site Personalizado e Próprio APK, os dois últimos abrem o modal de contato); "Como funciona" com os 3 passos (Monte seu catálogo, Compartilhe o link, Entregue e receba). Modal de contato (Nome, Telefone, E-mail, Mensagem) e envio de leads inalterados.
- **Checkout (`cliente.html`):** com o checkout simples ligado, o cliente vê só o valor final e a etiqueta **Frete Grátis** (sem "Taxa de Serviço" e sem taxa de entrega separadas). O split loja/plataforma continua nos bastidores.
- **Entregador (`motoboy.html`):** Bicicleta só vê corridas de até **5 km**. Despacho: a corrida aparece de imediato para quem tem o **bairro do cadastro igual ao do pedido** (ou cadastro sem bairro); para os demais, só **após 6 minutos** (a tela reavalia a cada 30 s). Nova corrida dispara **som + cartão flutuante** (inicial da loja, loja, bairro, km, valor) e notificação do sistema se permitida.
- `sw.js`: `pedeai-v5.4.7`.
- **Limites (honestos):** o app não tem GPS, então "mais próximos" = mesmo bairro do cadastro; o prazo de 6 min usa a hora da última atualização do pedido (`atualizadoEm`); o cartão mostra a inicial da loja, não a logo (o pedido não carrega logo). `criador.html` não foi alterado (já tinha a entrada de Módulos). Não rodei a suíte de navegador (sem rede/playwright aqui): só conferi a sintaxe de todos os scripts. Teste no celular.
- **Gaveta (não feito):** comissões/indicação, Marketplace unificado, backup no Google Drive, PedeAqui Solidário.

## v5.5.0 · Site, Reset Total, Cozinha, Pedido do Salão
- **Site:** `index.html` agora é a landing page de vendas (antigo `site.html`, apagado). Botão "Acesso Criador" no topo → `criador.html`. O hub de apps continua em `PedeAi.html`.
- **Reset Total (Criador → Lojas e dados):** apaga lojas, ADMs, entregadores, equipe, convites, cargos, vendas, ocorrências, leads e as configurações do Criador (preços/Pix, pagamento, links); contador volta a 5000. Três camadas: aviso, "Tem certeza?" e digitar `ZERAR`. Não apaga fotos do Storage. **Republique `firebase/firestore.rules`** (o Criador agora pode apagar `cargos`).
- **Cozinha (`cozinha.html`):** app novo (manifest e ícone próprios). Funcionário com cargo contendo "Cozinha", autorizado pelo ADM. Fila do mais antigo para o mais novo (pedidos em "preparo" + pedidos do garçom recém-enviados); mostra mesa, itens, observação em destaque e quem enviou; PRONTO muda o status na hora (Loja e Garçom veem); som a cada pedido novo (toque em "Ativar som" uma vez).
- **Garçom:** "Minhas mesas" com Compartilhar no WhatsApp, Fechar Mesa / Receber (Dinheiro, Cartão, Pix) e Imprimir Recibo (`window.print()` + `@media print`). Aviso quando o pedido da mesa fica pronto.
- **Loja:** a aba que era "Garçom" virou **Pedido do Salão** (monitoramento em tempo real; botão para lançar pedido como garçom). O nome do garçom abre o histórico de vendas (mesa, itens, pagamento, valor) com **Valor Total**.
- **Sincronização:** já era `onSnapshot` em tempo real (o reler a cada 5 s é só reserva). Faixa verde "● Online · sincronizado" em todos os apps.
- Testes novos: `t11_salao_cozinha.py` (22) e `t12_reset_total.py` (17). `sw.js`: `pedeai-v5.5.0`.

## v5.6.0 · Lista de 27 itens (Resumo, Caixa real, Estoque, Patrimônio, Entrega, Dossiê)
**Republique `firebase/firestore.rules`** (novas: coleção `lojaDados`, campo `perm` em `equipe`, Criador apaga `cargos`).
- **Loja:** abre no **Resumo** (pedidos novos/em preparo/prontos, vendas, mesas abertas e alertas: estoque baixo, assinatura perto de vencer, caixa aberto há muito tempo, diferença no fechamento, entrega sem tipo). Novas abas **Estoque** (insumos por categoria, mínimo, data/hora de cada entrada) e **Patrimônio**.
- **Caixa real e salvo na nuvem** (`lojaDados/{loja}`): abertura com valor inicial + data/hora + login; **Gerar Saída** (valor, descrição, data, login de quem autorizou); fechamento com valor contado, data/hora, login e diferença. O fechamento antigo tinha horário fixo "23:05": corrigido.
- **Entrega:** em Gestão, a Loja libera/bloqueia as entregas e escolhe obrigatoriamente **Grátis** (loja paga; motoboy vê KM) ou **Cobrada** (cliente paga; motoboy vê R$ e KM). O pedido carrega `entTipo`.
- **Motoboy:** aba **Histórico** (Pagas pela Loja = KM; Pagas pelo Cliente = R$) com resumo (quantidade e total de KM). Envio de fotos do cadastro não fica mais preso em "Enviando…" (limite de tempo + mensagem). Logo da loja no topo.
- **Cliente:** card da loja mais abaixo; botão **Histórico de Endereços** (últimos 10 endereços, usar/apagar). Respeita "entregas bloqueadas" pela loja.
- **Módulos:** a Loja liga/desliga Vitrine, Gestão, Garçom, Cozinha e Motoboy (escolha em `modLoja`; o que o ADM desligou não pode ser religado pela loja).
- **Permissões por funcionário:** na aba Equipe, checkboxes (Pedidos, Produtos, Estoque, Caixa, Salão, Histórico, Gestão). Desmarcado = a aba some para ele.
- **Pedido do Salão:** filtros por garçom e data e rendimento (total + comissão estimada). **Imprimir comanda** na Loja, no Garçom e na Cozinha.
- **Relatório do Contador** (Gestão): receitas por forma de pagamento, despesas (saídas), folha e comissões, em PDF (imprimir/salvar, funciona offline) e Excel (.csv).
- **ADM:** nova aba **Dossiê** com saídas de caixa, fechamentos, estoque e patrimônio de cada loja.
- **Filtros rápidos** em Pedidos, Histórico, Estoque e Pedido do Salão.
- Testes novos: `t13_v56.py` (24) e `t14_adm_motoboy.py` (7).

## v5.6.0 · Lista de 27 itens (o que entrou)
- **Cliente:** card da loja mais abaixo; "📚 Histórico de Endereços" (últimos 10, usar/apagar); pedido leva `entTipo` (grátis/cobrada); respeita "entregas liberadas" da loja.
- **Loja:** abre no **📊 Resumo** (pedidos novos/preparo/prontos, vendas, mesas abertas e alertas: estoque baixo, assinatura vencendo, caixa aberto há muito tempo, diferença no fechamento, entrega sem tipo). Abas **Estoque** (insumos por categoria, data/hora de entrada, mínimo) e **Patrimônio**. **Caixa real**: abertura/fechamento com valor, data/hora e login; **Gerar Saída** (valor, descrição, data, login) que vai para o **Dossiê do ADM**. **Gestão:** entrega liberada + Grátis/Cobrada (obrigatório), módulos da loja, Relatório do Contador (PDF e Excel/CSV). **Equipe:** checkboxes de permissões por funcionário. Filtros rápidos em Pedidos, Histórico, Estoque e Pedido do Salão (por garçom e data, com rendimento e comissão estimada). Imprimir comanda (Loja, Garçom, Cozinha).
- **Motoboy:** grátis = KM; cobrada = R$ + KM; aba **Histórico** (Pagas pela Loja / Pagas pelo Cliente) com resumo (entregas, KM, R$). Envio de fotos no cadastro com tempo limite (não fica preso em "Enviando…").
- **Dados:** coleção `lojaDados/{slug}` (caixa, saídas, estoque, patrimônio). **Republique `firebase/firestore.rules`.** O campo `modulos` continua sendo do Criador/ADM; a escolha da loja fica em `modulosLoja`.
- **Não coberto (precisa de app nativo/dispositivo):** gerar APK, permissão "Sobrepor outros apps" do Android, teste em celulares reais.

## v5.7.0 · Itens 28 a 31 (Base Padrão V1.0)
- **28 Fila de motoboy:** motoboy escolhe Modo Loja (fila FIFO, botão "Estou na Loja", pedido pronto vai para o 1º, sai ao aceitar, volta pelo fim, não pega 2 seguidos se há outro na fila) ou Marketplace (sem fila, até 4 entregas na mesma região). A Loja vê a fila em tempo real (aba Entregas) e liga/desliga o Marketplace na Gestão. Coleção nova `filas/{slug}`; campo `mkt` no pedido.
- **29 Tempo e atrasos:** barra de progresso por pedido na Cozinha; estourou = card vermelho + alerta sonoro/visual que repete até "Pronto"; prorrogar (+2/+3/+5/outro) só o Gerente, com registro (uid, role, de, para, hora); o vermelho não some ao prorrogar; relatório de atrasos no dossiê do ADM (dia/semana/mês). Tempo estimado configurável na Gestão.
- **30 Bloqueio:** bloqueio total 33 dias após o vencimento (app, regras e simulador); banners D-7 amarelo, D-3 laranja, D-1 vermelho + notificação; tolerância offline de 72 h (relógio do aparelho voltando atrás também exige conexão); pedidos em andamento podem ser finalizados; pedidos novos são recusados pelo servidor.
- **31 Pix com valor e ID do pedido:** código copia-e-cola (BR Code com CRC) + QR Code gerados no app (`pixbr.js`), pedido nasce "Aguardando pagamento", Gerente ou Caixa marca "Pago", cancelamento automático no prazo (padrão 10 min, configurável). Camada abstraída em `PIX_PROVIDER` para trocar por gateway.
- **Republique `firebase/firestore.rules`** (novos: `filas`, leitura/aceite de corridas do marketplace, 33 dias).
- Testes novos: t15_pix (13), t16_tempo (15), t17_bloqueio (16), t18_fila (16). Lógica: 12.

## v5.7.1 · Criador no formato do preview (6 abas)
Alterado SOMENTE o painel do Criador (`criador.html`) e uma ponte de leitura em `conta.js`; o resto ficou igual. Republicar `firestore.rules` não é necessário.
- **Abas (como no `preview-criador.html`):** 👑 ADMs · 💰 Faturamento · 🔓 Travas · 💾 Backup · 📨 Mensagens · ⚙️ Configurações. Abre em ADMs.
- **ADMs:** número de ADMs, lojas (total e suspensas), planos vencidos, pedidos de hoje, Total de Motoboys (lista) e contas por tipo, tudo lido do Firebase.
- **Faturamento:** Pix em análise (a confirmação continua em Contas e pagamentos), pedidos entregues, volume e comissão estimada (7%) dos últimos 30 dias, mensalidades por mês e faturamento por loja.
- **Travas:** totais, lista de lojas com busca, situação (Ativa, Plano vencido, Suspensa, Aguardando gerente) e **Suspender/Reativar loja** (grava `lojas/{slug}.suspensa`).
- **Configurações:** os 5 cartões de antes (Contas e pagamentos, Lojas e dados com Zerar e Reset Total, Links de pagamento, Módulos e preço por loja, Leads do site), perfil, planos e valores atuais (R$ 199,90 / 1.999 / 4.799 / 7.199 e ADM R$ 299,90), teste de aviso e Sair.
- **Não ligados (só avisam na tela):** Backup mestre, Mensagens ADM→Criador, Motoboys globais, Marketplace e Pagamentos ON/OFF. Preços e textos antigos do preview (R$ 100/mês, R$ 1.000…) NÃO foram usados. O limite de 15 pedidos/dia continua fora do Criador (removido na v5.2).
- `conta.js`: novas `PA_criadorDados` (lê lojas, contas e pedidos) e `PA_criadorSuspender`. `sw.js`: `pedeai-v5.7.1`.
- Testes: novo `t19_criador_abas.py` (20 checagens). `t4`, `t7_zerar` e `t12_reset_total` agora clicam na aba Configurações antes dos cartões. Suíte: 242 de 242.


## v5.8.0 · Limpeza do que não é real + relatório do ADM + teste de isolamento
**Status: 🟡 parcial. Este ciclo NÃO fecha APK** (faltam os 4 P0: push FCM, offline Firestore, valor no servidor, rules `lojaDados` + emulador). Republicar `firestore.rules` NÃO é necessário.
- **ADM (`adm.html`):** aba **📨 Mensagens removida** (era caixa de exemplo, nada chegava de verdade). Texto do **Marketplace** corrigido: quem liga/desliga é cada loja, na Gestão dela (antes dizia "Desligado" e "quem liga é o Criador"). **Relatório da administração (PDF) ampliado:** despesas (saídas de caixa, 30 dias e total), folha mensal (equipe ativa; salário do funcionário ou do cargo) e taxas de serviço (soma de `ts` dos pedidos entregues/retirados, 30 dias e total), no resumo geral e por loja. Novas leituras `PA.getEquipeAdm` e `PA.getCargosAdm` (já permitidas pelas regras: `admId == uid`).
- **Loja (`lojista.html`):** tela **Aprovar Entregador** (lista Motoboys com Aprovar/Recusar/Suspender) removida: era de exemplo (`MB` nunca era preenchido). O vínculo real continua pelo **link/código de convite** (Compartilhar link do motoboy). **Diárias escondidas** por `DIARIAS_ON=false` (formulário e lista); a aba **Entregas** (motoboys online, alertas, fila) continua. Removidas as frases falsas ("os entregadores aprovados já podem ver", "e peça diárias").
- **Entregador (`motoboy.html`):** item **Diárias Disponíveis** do menu escondido por `DIARIAS_ON=false`; textos e avisos que sugeriam que a loja era avisada foram corrigidos.
- **Criador (`criador.html`):** texto de Controles do sistema: o Marketplace não tem chave global (cada loja liga/desliga). Nada mais mudou.
- **Teste novo `t31_isolamento.py` (12 checagens):** C1 não vinculado, C2 vinculado à loja Y lendo a X, C3 vinculado à X lendo a X, mais controles positivos, a fronteira do Marketplace (corrida `mkt=true` enviada é visível por desenho) e escrita negada. Conferido por mutação: com a regra `motoboyDaLoja` quebrada no simulador, cai para 5/12.
- `sw.js`: `pedeai-v5.8.0`. `rodar-tudo.sh` inclui o t31.
- **Limites:** o teste roda no simulador de Firestore e na porta das regras feita neste projeto; **não substitui o emulador/projeto Firebase real**. O PDF do ADM foi conferido com jsPDF simulado (a biblioteca vem da internet), não aberto em PDF real. "Taxas" = taxa de serviço (`ts`); confirmar se é isso que o ADM precisa.
- **Pendente conhecido (não mexido):** "Motoboys online" da Loja usa `MB`, que nunca é preenchido (sempre "Nenhum motoboy online"); o botão "Falar com o Criador" do ADM mostra "Mensagem enviada" sem enviar nada.
