# CordX — Documentação (Português)

> Biblioteca de extensão para **discord.js** que cobre funcionalidades da Discord API que ainda não estão no discord.js: Soundboard, Polls, Monetização (SKUs / Entitlements / Subscriptions), Onboarding, Voice Effects e Super Reactions.

---

## Instalação

```bash
npm install cordx discord.js
# ou
yarn add cordx discord.js
# ou
pnpm add cordx discord.js
```

---

## Início Rápido

### CommonJS (require)

```js
const { Client, GatewayIntentBits } = require('discord.js');
const { CordX } = require('cordx');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const cordx  = new CordX(client);

client.once('ready', async () => {
  const sons = await cordx.soundboard.getDefaultSounds();
  console.log(sons);
});

client.login('SEU_TOKEN');
```

### ESM (import)

```js
import { Client, GatewayIntentBits } from 'discord.js';
import { CordX } from 'cordx';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const cordx  = new CordX(client);

client.once('ready', async () => {
  const skus = await cordx.monetization.getSkus();
  console.log(skus);
});

client.login('SEU_TOKEN');
```

---

## CordX(client)

Classe principal. Passe sua instância do `Client` do discord.js.

| Propriedade        | Tipo                     | Descrição                               |
|--------------------|--------------------------|-----------------------------------------|
| `.soundboard`      | `SoundboardManager`      | API de Soundboard                       |
| `.polls`           | `PollManager`            | API de Enquetes                         |
| `.monetization`    | `MonetizationManager`    | SKUs, Entitlements, Subscriptions       |
| `.onboarding`      | `OnboardingManager`      | API de Onboarding de Servidor           |
| `.voiceEffects`    | `VoiceEffectsManager`    | API de Efeitos de Voz                   |
| `.superReactions`  | `SuperReactionsManager`  | API de Super Reactions (Burst)          |

---

## SoundboardManager

### `getDefaultSounds()`
Retorna os sons padrão do Discord.

### `getGuildSounds(guildId)`
Retorna todos os sons customizados de um servidor.

### `getSound(guildId, soundId)`
Retorna um som específico.

### `createSound(guildId, options, reason?)`
Cria um som no servidor. Opções:
```js
{
  name: 'meu-som',                    // Obrigatório. 2–32 chars
  sound: 'data:audio/mp3;base64,...', // Obrigatório. Base64 data URI
  volume: 0.8,                        // Opcional. 0–1 (padrão 1)
  emojiId: '123456789',               // Opcional. ID de emoji customizado
  emojiName: '🔥',                   // Opcional. Emoji unicode
}
```

### `editSound(guildId, soundId, options, reason?)`
Edita nome, volume ou emoji de um som.

### `deleteSound(guildId, soundId, reason?)`
Deleta um som do servidor.

### `sendSound(channelId, soundId, sourceGuildId?)`
Envia um som para um canal de voz. `sourceGuildId` é obrigatório para sons de servidor.

---

## PollManager

### `create(channelId, options)`
Cria uma mensagem com enquete. Opções:
```js
{
  question: 'Qual sua cor favorita?',  // Obrigatório
  answers: [                           // Obrigatório. Máximo 10
    { text: 'Vermelho', emojiName: '🔴' },
    { text: 'Azul', emojiName: '🔵' },
  ],
  duration: 24,            // Horas. 1–168 (padrão 24)
  allowMultiselect: false, // Padrão false
  content: 'Vote agora!',  // Conteúdo opcional da mensagem
}
```

### `expire(channelId, messageId)`
Encerra uma enquete imediatamente.

### `getAnswerVoters(channelId, messageId, answerId, query?)`
Retorna usuários que votaram em uma resposta.
- `query.after` — Snowflake para paginação
- `query.limit` — Máximo de resultados (1–100)

---

## MonetizationManager

### `getSkus()`
Lista todos os SKUs da aplicação.

### `getEntitlements(query?)`
Lista entitlements. Filtros opcionais:
```js
{
  userId: '123',
  skuIds: ['456', '789'],
  guildId: '111',
  excludeEnded: true,
  before: 'snowflake',
  after: 'snowflake',
  limit: 100,
}
```

### `getEntitlement(entitlementId)`
Retorna um entitlement específico.

### `createTestEntitlement(skuId, ownerId, ownerType)`
Cria um entitlement de teste. `ownerType`: `1` = servidor, `2` = usuário.

### `deleteTestEntitlement(entitlementId)`
Deleta um entitlement de teste.

### `consumeEntitlement(entitlementId)`
Marca um entitlement de compra única como consumido.

### `getSkuSubscriptions(skuId, query?)`
Lista assinaturas de um SKU.

### `getSubscription(skuId, subscriptionId)`
Retorna uma assinatura específica.

---

## OnboardingManager

### `get(guildId)`
Retorna a configuração de onboarding de um servidor.

### `edit(guildId, options, reason?)`
Edita a configuração de onboarding. Opções:
```js
{
  prompts: [...],                          // Array de prompts de onboarding
  defaultChannelIds: ['canalId'],          // Canais que o usuário entra automaticamente
  enabled: true,
  mode: 0,  // 0 = ONBOARDING_DEFAULT, 1 = ONBOARDING_ADVANCED
}
```

---

## VoiceEffectsManager

### `listEffects(channelId)`
Lista os efeitos de voz disponíveis para a sessão de voz atual.

### `setEffect(channelId, options)`
Aplica um efeito de voz. Passe `effectId: null` para remover.
```js
{
  effectId: 'snowflake_do_efeito',
  animationType: 0,
  animationId: 0,
  sessionId: 'id_da_sessao_de_voz',
}
```

---

## SuperReactionsManager

### `getBurstReactors(channelId, messageId, emoji, query?)`
Retorna usuários que adicionaram uma super reaction (burst).

### `deleteBurstReaction(channelId, messageId, emoji)`
Deleta todas as burst reactions de um emoji em uma mensagem.

### `getReactionSummary(channelId, messageId)`
Retorna o resumo de todas as reações (normais + burst) de uma mensagem.

---

## Tratamento de Erros

```js
const { CordXError, CordXErrorCode } = require('cordx');

try {
  await cordx.polls.create(channelId, { question: 'Oi', answers: [], duration: 999 });
} catch (err) {
  if (err instanceof CordXError) {
    console.log(err.code);       // Ex: 'POLL_INVALID_DURATION'
    console.log(err.message);    // Mensagem legível
    console.log(err.httpStatus); // Status HTTP se aplicável
    console.log(err.retryable);  // true se pode tentar novamente
  }
}
```

### Códigos de Erro

| Código                      | Descrição                                        |
|-----------------------------|--------------------------------------------------|
| `RATE_LIMITED`              | Sofrendo rate limit                              |
| `UNKNOWN_INTERACTION`       | Interação expirada (>15 min)                     |
| `UNKNOWN_CHANNEL`           | Canal não encontrado                             |
| `MISSING_PERMISSIONS`       | Bot sem permissões necessárias                   |
| `SOUNDBOARD_INVALID_VOLUME` | Volume fora do intervalo 0–1                     |
| `SOUNDBOARD_LIMIT_REACHED`  | Limite de sons do servidor atingido              |
| `POLL_ALREADY_EXPIRED`      | Enquete já encerrada                             |
| `POLL_INVALID_DURATION`     | Duração fora de 1–168 horas                      |
| `POLL_TOO_MANY_ANSWERS`     | Mais de 10 respostas                             |
| `ENTITLEMENT_NOT_FOUND`     | Entitlement não existe                           |
| `SKU_NOT_FOUND`             | SKU não encontrado                               |
| `SUBSCRIPTION_NOT_FOUND`    | Assinatura não encontrada                        |
| `ONBOARDING_INVALID_CONFIG` | Configuração de onboarding inválida              |
| `CLIENT_NOT_READY`          | Client ainda não logado                          |
