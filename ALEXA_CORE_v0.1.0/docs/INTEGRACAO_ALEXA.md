# Integração Alexa — v0.1.0

## Arquitetura recomendada

Alexa / Echo
  -> Multi-Capability Skill
  -> AWS Lambda (`alexa/mcs-lambda.mjs`)
  -> ALEXA CORE publicado no Render
  -> adaptador do dispositivo real (próxima versão)

## Por que existe uma Lambda

A documentação Smart Home atual da Amazon orienta implementar o add-on Smart Home como AWS Lambda. O ALEXA CORE continua independente e pode ficar no Render.

## Modelo Custom

O arquivo `interaction-model-pt-BR.json` oferece duas formas de entrada:

- `CompositeCommandIntent`: frases estruturadas com até três cômodos.
- `FreeCommandIntent`: frase livre encaminhada ao motor, usando `AMAZON.SearchQuery` com palavras de apoio como “execute”.

A resposta mantém `shouldEndSession=false`, permitindo continuidade enquanto a sessão da Skill estiver aberta e a Alexa continuar aceitando turnos.

## Modelo Smart Home

A Lambda responde a:

- Discovery
- PowerController TurnOn
- PowerController TurnOff
- BrightnessController SetBrightness

Na v0.1 os dispositivos são simulados pelo Core. Na próxima etapa, o mesmo contrato será ligado às lâmpadas reais.

## Variáveis da Lambda

- `CORE_BASE_URL`: URL pública do ALEXA CORE, por exemplo `https://alexa-core.onrender.com`
- `CORE_API_KEY`: chave secreta compartilhada com o Core

No Render, configure a mesma chave como `CORE_API_KEY`.

## Limite atual

O projeto já separa comandos compostos em várias ações. Porém, uma frase Smart Home nativa sem nome de Skill depende da Alexa/Alexa+ interpretar a fala e rotear as diretivas. Para conversa controlada pelo nosso próprio motor, usa-se o modelo Custom e mantém-se a sessão aberta.

O Smart Home AI Toolkit lançado em 2026 não é base desta versão porque está em preview, exige acesso da Amazon e, no momento, as custom capabilities estão limitadas ao inglês dos EUA.
