(() => {
  const defaults = { round: 0, players: [], roundTotal: 0, potTotal: 0 };

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
    icon.textContent = vote === 'higher' ? 'H' : vote === 'lower' ? 'L' : '-';

    const bet = document.createElement('span');
    bet.className = 'hl-board__player-bet';
    bet.textContent = vote
      ? money(player.bet)
      : 'Waiting';

    row.append(name, icon, bet);
    return row;
  }

  function build(panel) {
    panel.setContent(
      '<div class="hl-board">' +
        '<div class="hl-board__round"></div>' +
        '<section class="hl-board__players-panel">' +
          '<div class="hl-board__heading">Players</div>' +
          '<div class="hl-board__players"></div>' +
        '</section>' +
        '<section class="hl-board__cards">' +
          '<div class="hl-board__deck"></div>' +
          '<div class="hl-board__previous"></div>' +
          '<div class="hl-board__current"></div>' +
        '</section>' +
        '<div class="hl-board__totals">' +
          '<div>Round Total <strong class="hl-board__round-total"></strong></div>' +
          '<div>Pot Total <strong class="hl-board__pot-total"></strong></div>' +
        '</div>' +
      '</div>'
    );
    return panel.element.querySelector('.hl-board');
  }

  function applyLayout(panel, layout) {
    const root = panel.element.querySelector('.hl-board') || build(panel);
    const board = layout.board;
    panel.element.style.width = board.width + 'px';
    panel.element.style.height = board.height + 'px';
    root.style.width = board.width + 'px';
    root.style.height = board.height + 'px';

    Object.keys(layout.elements).forEach(name => {
      const target = root.querySelector('.hl-board__' + name);
      const value = layout.elements[name];
      if (!target) return;
      target.style.left = value.x + 'px';
      target.style.top = value.y + 'px';
      target.style.width = value.width + 'px';
      target.style.height = value.height + 'px';
    });

    return root;
  }

  function update(panel, state = {}) {
    const data = { ...defaults, ...state };
    const root = panel.element.querySelector('.hl-board') || build(panel);
    const players = Array.isArray(data.players) ? data.players : [];

    root.querySelector('.hl-board__round').textContent =
      'ROUND ' + String(data.round);
    root.querySelector('.hl-board__round-total').textContent =
      money(data.roundTotal);
    root.querySelector('.hl-board__pot-total').textContent =
      money(data.potTotal);

    const list = root.querySelector('.hl-board__players');
    list.replaceChildren();

    players.forEach(player => {
      list.appendChild(playerRow(player));
    });

    return root;
  }

  window.RTSHigherLowerBoard = { build, update, applyLayout };
})();
