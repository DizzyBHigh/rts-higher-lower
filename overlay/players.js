(() => {
  const money = value => {
    if (String(value || '').toUpperCase() === 'BANK') return 'BANK';
    const amount = Number(value);
    return Number.isFinite(amount) ? amount.toLocaleString('en-US') : '0';
  };

  function playerRow(player) {
    const row = document.createElement('div');
    row.className = 'hl-board__player';

    const name = document.createElement('span');
    name.className = 'hl-board__player-name';
    name.textContent = player.name || '';

    const vote = String(player.vote || '').toLowerCase();
    const icon = document.createElement('span');
    icon.className = 'hl-board__player-vote hl-board__player-vote--' +
      (vote || 'waiting');
    icon.title = vote === 'higher' ? 'Higher' :
      vote === 'lower' ? 'Lower' : 'Waiting';

    const bet = document.createElement('span');
    bet.className = 'hl-board__player-bet';
    bet.textContent = vote ? money(player.bet) : 'Waiting';

    row.append(name, icon, bet);
    return row;
  }

  function build(panel) {
    panel.setContent(
      '<section class="hl-board__players-panel">' +
        '<div class="hl-board__heading">Players</div>' +
        '<div class="hl-board__players"></div>' +
      '</section>'
    );
    return panel.element.querySelector('.hl-board__players-panel');
  }

  function update(panel, state = {}) {
    const root = panel.element.querySelector('.hl-board__players-panel') ||
      build(panel);
    const list = root.querySelector('.hl-board__players');
    const players = Array.isArray(state.players) ? state.players : [];
    list.replaceChildren();
    players.forEach(player => list.appendChild(playerRow(player)));
    return root;
  }

  window.RTSHigherLowerPlayers = { build, update };
})();
