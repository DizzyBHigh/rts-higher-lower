(() => {
  const extension = RTS.getExtension('rts-higher-lower');
  const host = document.getElementById('extension-tools');
  if (!extension || !host || !RTS.core.ui) return;

  const state = {
    round: 4,
    players: [
      { name: 'DuhBuhHuh', vote: 'Higher', bet: 5000 },
      { name: 'Johnny', vote: 'Lower', bet: 1000 },
      { name: 'Dawn', vote: 'Lower', status: 'BANK', bet: 0 },
      { name: 'JayGeeX', vote: 'Higher', bet: 2000 },
      { name: 'Bobby', vote: 'Higher', bet: 2000 }
    ],
    roundTotal: 10000,
    potTotal: 28000
  };

  const section = document.createElement('section');
  section.className = 'hl-dev hl-dev--tests';
  section.innerHTML = '<strong>RTS Higher Lower Tests</strong>';
  host.appendChild(section);

  const actions = document.createElement('div');
  actions.className = 'hl-dev__actions';
  const testStateButton = RTS.core.ui.button('Show Test State', { variant: 'blue' });
  const startButton = RTS.core.ui.button('Start Game', { variant: 'blue' });
  const drawButton = RTS.core.ui.button('Draw Card', { variant: 'blue' });
  const resetButton = RTS.core.ui.button('Reset Layout', { variant: 'blue' });
  testStateButton.dataset.action = 'state';
  startButton.dataset.action = 'start';
  drawButton.dataset.action = 'draw';
  resetButton.dataset.action = 'reset';
  actions.append(testStateButton, startButton, drawButton, resetButton);
  section.appendChild(actions);

  section.addEventListener('click', async event => {
    const action = event.target?.dataset?.action;
    if (!action) return;
    try {
      if (action === 'state') extension.api.updateState(state);
      if (action === 'start') extension.api.startGame(10);
      if (action === 'draw') await extension.api.drawCard();
      if (action === 'reset') extension.api.setLayout(RTSHigherLowerLayout.create());
    } catch (error) {
      document.getElementById('log').textContent = error.message;
    }
  });
})();
