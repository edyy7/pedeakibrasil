# PedeAí Brasil · v4 conectada ao Firebase

## Colocar no ar (15 min)
1. **Firebase Console** → projeto `delivery-67d14`:
   - *Firestore Database* → criar banco (modo produção).
   - *Authentication* → Método de login → ativar **Anônimo**.
   - *Firestore → Regras* → colar o conteúdo de `firestore.rules` → Publicar.
2. **Vercel** (ou Netlify): arraste esta pasta inteira. Anote o endereço (ex.: `meu-projeto.vercel.app`).
3. Firebase → *Authentication → Configurações → Domínios autorizados* → adicionar o endereço da Vercel.
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
