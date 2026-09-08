import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand } from '../src/command-engine.js';

test('decompõe três ações em uma frase', () => {
  const r = parseCommand('apague a sala e acenda o corredor e o quarto');
  assert.equal(r.ok, true);
  assert.deepEqual(r.actions.map(a => [a.type, a.target]), [
    ['off', 'sala'], ['on', 'corredor'], ['on', 'quarto']
  ]);
});

test('aplica uma ação a dois cômodos', () => {
  const r = parseCommand('acenda a cozinha e a varanda');
  assert.deepEqual(r.actions.map(a => [a.type, a.target]), [
    ['on', 'cozinha'], ['on', 'varanda']
  ]);
});

test('interpreta brilho', () => {
  const r = parseCommand('deixe o quarto em 30 por cento');
  assert.equal(r.actions[0].type, 'brightness');
  assert.equal(r.actions[0].target, 'quarto');
  assert.equal(r.actions[0].value, 30);
});

test('interpreta tudo menos um cômodo', () => {
  const r = parseCommand('daqui a 1 minuto apague tudo menos o corredor');
  assert.equal(r.actions[0].type, 'off');
  assert.equal(r.actions[0].target, '*');
  assert.deepEqual(r.actions[0].exclude, ['corredor']);
  assert.equal(r.actions[0].delayMs, 60000);
});

test('mantém ação no contexto', () => {
  const first = parseCommand('acenda o corredor');
  const second = parseCommand('a cozinha também', first.context);
  assert.deepEqual(second.actions.map(a => [a.type, a.target]), [['on', 'cozinha']]);
});
