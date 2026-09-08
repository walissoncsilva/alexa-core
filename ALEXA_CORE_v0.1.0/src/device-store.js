const devices = new Map([
  ['sala', { id: 'sala', name: 'Sala', type: 'light', power: false, brightness: 100 }],
  ['corredor', { id: 'corredor', name: 'Corredor', type: 'light', power: false, brightness: 100 }],
  ['quarto', { id: 'quarto', name: 'Quarto', type: 'light', power: false, brightness: 100 }],
  ['cozinha', { id: 'cozinha', name: 'Cozinha', type: 'light', power: false, brightness: 100 }],
  ['varanda', { id: 'varanda', name: 'Varanda', type: 'light', power: false, brightness: 100 }],
  ['banheiro', { id: 'banheiro', name: 'Banheiro', type: 'light', power: false, brightness: 100 }]
]);

export function listDevices() {
  return [...devices.values()].map(d => ({ ...d }));
}

export function executeAction(action) {
  if (action.target === '*') {
    const excluded = new Set(action.exclude ?? []);
    const results = [];
    for (const device of devices.values()) {
      if (excluded.has(device.id)) continue;
      results.push(executeAction({ ...action, target: device.id, exclude: undefined }));
    }
    return results.flat();
  }

  const device = devices.get(action.target);
  if (!device) return [{ ok: false, target: action.target, error: 'Dispositivo não encontrado' }];

  if (action.type === 'on') device.power = true;
  if (action.type === 'off') device.power = false;
  if (action.type === 'brightness') {
    device.power = action.value > 0;
    device.brightness = action.value;
  }

  return [{ ok: true, target: device.id, state: { ...device } }];
}
