(() => {
  const money = value => {
    if (String(value || '').toUpperCase() === 'BANK') return 'BANK';
    const amount = Number(value);
    return Number.isFinite(amount) ? amount.toLocaleString('en-US') : '0';
  };

  const platformName = value => {
    const name = String(value || 'unknown').toLowerCase();
    return ['twitch', 'youtube', 'kick'].includes(name) ? name : 'unknown';
  };

  function playerRow(player) {
    const row = document.createElement('div');
    row.className = 'hl-board__player';

    const name = document.createElement('span');
    name.className = 'hl-board__player-name';
    name.textContent = player.name || '';

    const vote = String(player.vote || '').toLowerCase();
    const platform = platformName(player.platform);
    const icon = document.createElement('span');
    icon.className = 'hl-board__player-vote hl-board__player-vote--' +
      (vote || 'waiting') + ' hl-board__player-vote--platform-' + platform;
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
        '<div class="hl-board__heading">' +
          '<span>Players</span>' +
          '<span class="hl-board__players-count">0/0</span>' +
        '</div>' +
        '<div class="hl-board__players"></div>' +
      '</section>'
    );
    return panel.element.querySelector('.hl-board__players-panel');
  }

  function applyAppearance(panel, appearance = {}) {
    const root = panel.element.querySelector('.hl-board__players-panel') ||
      build(panel);
    const value = appearance.players || {};
    const angle = ((Number(value.gradientDirection) || 0) + 90) % 360;
    const color1 = value.color1 || '#20252a';
    const color2 = value.color2 || '#20252a';
    const borderWidth = Number(value.borderWidth) || 0;
    const borderColor = value.borderColor || '#0384CB';
    const radius = Number(value.cornerRadius) || 0;

    root.style.setProperty('--hl-players-color-1', color1);
    root.style.setProperty('--hl-players-color-2', color2);
    root.style.setProperty('--hl-players-gradient-direction', angle + 'deg');
    root.style.setProperty('--hl-players-border-width', borderWidth + 'px');
    root.style.setProperty('--hl-players-border-color', borderColor);
    root.style.setProperty('--hl-players-radius', radius + 'px');
    return root;
  }

  function update(panel, state = {}) {
    const root = panel.element.querySelector('.hl-board__players-panel') ||
      build(panel);
    const list = root.querySelector('.hl-board__players');
    const count = root.querySelector('.hl-board__players-count');
    const players = Array.isArray(state.players) ? state.players : [];
    const started = Number(state.startedPlayers) || players.length;

    if (count) count.textContent = players.length + '/' + started;
    list.replaceChildren();
    players.forEach(player => list.appendChild(playerRow(player)));
    return root;
  }

  window.RTSHigherLowerPlayers = { build, update, applyAppearance };
})();
