# ALEXA CORE v0.1.0

Protótipo funcional de orquestrador de comandos compostos para casa inteligente.

## O que já funciona

- Painel responsivo para tablet/celular/PC.
- Comando composto: `apague a sala e acenda o corredor e o quarto`.
- Múltiplos cômodos: `acenda a cozinha e a varanda`.
- Brilho: `deixe o quarto em 30 por cento`.
- Exceção global: `apague tudo menos o corredor`.
- Agendamento simples: `daqui a 1 minuto apague tudo menos o corredor`.
- Contexto por sessão.
- Reconhecimento de voz no navegador quando suportado.
- PWA básica.
- Endpoint protótipo para Alexa Custom Skill em `/alexa/custom`.
- Adaptador AWS Lambda Multi-Capability em `alexa/mcs-lambda.mjs` (Custom + Smart Home).
- Modelo de interação pt-BR em `alexa/interaction-model-pt-BR.json`.
- `render.yaml` para publicação do backend/painel.
- Zero dependências npm: usa apenas Node.js, simplificando o deploy pelo tablet.

## Importante

A v0.1 usa **dispositivos simulados**. Ela serve para validar o cérebro/orquestrador antes de conectar lâmpadas reais.

O endpoint Alexa incluído é de desenvolvimento. Antes de publicação/certificação, é obrigatório implementar a validação de autenticidade/assinatura das requisições Alexa e configurar HTTPS, account linking e os requisitos de segurança aplicáveis.

## Desenvolvimento apenas pelo tablet

1. Crie um repositório no GitHub pelo navegador do tablet.
2. Envie o conteúdo deste ZIP para o repositório.
3. No Render, crie um Web Service ligado a esse repositório, ou use o Blueprint com `render.yaml`.
4. Após o deploy, abra a URL fornecida pelo Render no navegador do tablet.
5. Teste os comandos no campo principal.

## Teste principal da v0.1

Digite:

`apague a sala e acenda o corredor e o quarto`

Resultado esperado:

- Sala = DESLIGADA
- Corredor = LIGADA
- Quarto = LIGADA
- Resposta = `Pronto.`

## Próxima etapa

Depois dessa validação:

1. Conectar um dispositivo real ou Home Assistant/Matter/API do fabricante.
2. Criar/configurar a Skill no Alexa Developer Console.
3. Publicar `alexa/mcs-lambda.mjs` em uma função AWS Lambda e configurar `CORE_BASE_URL`/`CORE_API_KEY`.
4. Conectar os modelos Custom e Smart Home da Skill à Lambda.
5. Testar sessão aberta, comandos sucessivos e Discovery Smart Home.
