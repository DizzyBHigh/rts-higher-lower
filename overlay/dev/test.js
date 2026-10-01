(() => {
  const extension = RTS.getExtension('rts-higher-lower');
  const host = document.getElementById('extension-tools');
  if (!extension || !host) return;

  const section = document.createElement('section');
  section.className = 'extension-dev-tools';
  section.innerHTML =
    '<strong>RTS Higher Lower</strong>' +
    '<div class="actions">' +
      '<button data-action="state">Show Test State</button>' +
      '<button data-action="start">Start Game</button>' +
      '<button data-action="draw">Draw Card</button>' +
    '</div>';

  host.appendChild(section);

  const output = document.getElementById('log');
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

  section.addEventListener('click', async event => {
    const action = event.target?.dataset?.action;
    if (!action) return;

    try {
      if (action === 'state')
        extension.api.updateState(state);

      if (action === 'start')
        extension.api.startGame(10);

      if (action === 'draw')
        await extension.api.drawCard();

      if (output) output.textContent = 'Higher Lower: ' + action;
    } catch (error) {
      if (output) output.textContent = error.message;
    }
  });
})();
