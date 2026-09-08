# TESTE ALEXA CORE v0.1.0

Execute estes testes no painel, nesta ordem.

## 1 — Comando composto principal

`apague a sala e acenda o corredor e o quarto`

Esperado:
- Sala: DESLIGADA
- Corredor: LIGADA
- Quarto: LIGADA

## 2 — Duas luzes na mesma ação

`acenda a cozinha e a varanda`

Esperado:
- Cozinha: LIGADA
- Varanda: LIGADA

## 3 — Brilho

`deixe o quarto em 30 por cento`

Esperado:
- Quarto: LIGADA
- Brilho: 30%

## 4 — Contexto

Primeiro:
`acenda o corredor`

Depois:
`a cozinha também`

Esperado:
- Corredor: LIGADA
- Cozinha: LIGADA

## 5 — Exceção

`apague tudo menos o corredor`

Esperado:
- Corredor permanece ligado
- Demais luzes desligadas

## 6 — Agendamento

`daqui a 1 minuto apague tudo menos o corredor`

Esperado:
- Painel informa ação agendada
- Após 1 minuto, somente o corredor permanece no estado anterior

## Critério para avançar

Se os testes 1 a 6 passarem no tablet, a v0.1.0 fica validada como núcleo e avançamos para o primeiro dispositivo real + configuração da Alexa.
