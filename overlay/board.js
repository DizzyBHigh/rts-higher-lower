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

    const bet = document.createElement('span');
    bet.className = 'hl-board__player-bet';
    bet.textContent = String(player.status || '').toUpperCase() === 'BANK'
      ? 'BANK'
      : money(player.bet);

    row.append(name, bet);
    return row;
  }

  function build(panel) {
    panel.setContent(
      '<div class="hl-board">' +
        '<div class="hl-board__round"></div>' +
        '<section class="hl-board__side hl-board__lower">' +
          '<div class="hl-board__heading">Lower</div>' +
          '<div class="hl-board__players"></div>' +
        '</section>' +
        '<section class="hl-board__cards">' +
          '<div class="hl-board__deck"></div>' +
          '<div class="hl-board__previous"></div>' +
          '<div class="hl-board__current"></div>' +
        '</section>' +
        '<section class="hl-board__side hl-board__higher">' +
          '<div class="hl-board__heading">Higher</div>' +
          '<div class="hl-board__players"></div>' +
        '</section>' +
        '<div class="hl-board__totals">' +
          '<div>Round Total <strong class="hl-board__round-total"></strong></div>' +
          '<div>Pot Total <strong class="hl-board__pot-total"></strong></div>' +
        '</div>' +
      '</div>'
    );
    return panel.element.querySelector('.hl-board');
  }

  function update(panel, state = {}) {
    const data = { ...defaults, ...state };
    const root = panel.element.querySelector('.hl-board') || build(panel);
    const players = Array.isArray(data.players) ? data.players : [];

    root.querySelector('.hl-board__round').textContent =
      'ROUND ' + String(data.round);
    root.querySelector('.hl-board__round-total').textContent = money(data.roundTotal);
    root.querySelector('.hl-board__pot-total').textContent = money(data.potTotal);

    const lower = root.querySelector('.hl-board__lower .hl-board__players');
    const higher = root.querySelector('.hl-board__higher .hl-board__players');
    lower.replaceChildren();
    higher.replaceChildren();

    players.forEach(player => {
      const vote = String(player.vote || '').toLowerCase();
      const target = vote === 'higher' ? higher : vote === 'lower' ? lower : null;
      if (target) target.appendChild(playerRow(player));
    });

    return root;
  }

  window.RTSHigherLowerBoard = { build, update };
})();
