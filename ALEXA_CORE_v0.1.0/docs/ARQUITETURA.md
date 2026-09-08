# Arquitetura v0.1

Tablet / Alexa
      |
      v
ALEXA CORE (Node/Express)
      |
      +-- Interpretador de linguagem simples
      +-- Memória curta por sessão
      +-- Orquestrador de ações
      +-- Agendador
      |
      v
Adaptadores de dispositivos
      |
      +-- Simulador (v0.1)
      +-- Home Assistant / Matter / fabricante (próxima etapa)

## Princípio

A fala não é tratada como um único comando rígido. Ela vira uma lista de ações independentes. Isso permite executar N ações a partir de uma frase.
