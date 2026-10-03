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
    row.className = 'hl-players__player';

    const name = document.createElement('span');
    name.className = 'hl-players__name';
    name.textContent = player.name || '';

    const vote = String(player.vote || '').toLowerCase();
    const platform = platformName(player.platform);
    const icon = document.createElement('span');
    icon.className = 'hl-players__vote hl-players__vote--' +
      (vote || 'waiting') + ' hl-players__vote--platform-' + platform;
    icon.title = vote === 'higher' ? 'Higher' :
      vote === 'lower' ? 'Lower' : 'Waiting';

    const bet = document.createElement('span');
    bet.className = 'hl-players__bet';
    bet.textContent = vote ? money(player.bet) : 'Waiting';

    row.append(name, icon, bet);
    return row;
  }

  function build(panel) {
    panel.setContent(
      '<section class="hl-players">' +
        '<div class="hl-players__heading">' +
          '<span>Players</span>' +
          '<span class="hl-players__count">0/0</span>' +
        '</div>' +
        '<div class="hl-players__list"></div>' +
      '</section>'
    );
    return panel.element.querySelector('.hl-players');
  }

  function applyAppearance(panel, appearance = {}) {
    const root = panel.element.querySelector('.hl-players') || build(panel);
    const value = appearance.players || {};
    const angle = ((Number(value.gradientDirection) || 0) + 90) % 360;
    const color1 = value.color1 || '#20252a';
    const color2 = value.color2 || '#20252a';
    const borderWidth = Number(value.borderWidth) || 0;
    const borderColor = value.borderColor || '#0384CB';
    const radius = Number(value.cornerRadius) || 0;
    const title = value.title || {};
    const titleShadow = title.shadowDirection || {};
    const shadowAngle = Number(titleShadow.angle) || 0;
    const shadowDistance = Math.max(0, Number(titleShadow.distance) || 0);
    const shadowRadians = shadowAngle * Math.PI / 180;
    const shadowX = Math.sin(shadowRadians) * shadowDistance;
    const shadowY = -Math.cos(shadowRadians) * shadowDistance;

    root.style.setProperty('--hl-players-color-1', color1);
    root.style.setProperty('--hl-players-color-2', color2);
    root.style.setProperty('--hl-players-gradient-direction', angle + 'deg');
    root.style.setProperty('--hl-players-border-width', borderWidth + 'px');
    root.style.setProperty('--hl-players-border-color', borderColor);
    root.style.setProperty('--hl-players-radius', radius + 'px');
    root.style.setProperty('--hl-players-title-color', title.color || '#ffffff');
    root.style.setProperty('--hl-players-title-shadow-color', title.shadowColor || '#000000');
    root.style.setProperty('--hl-players-title-shadow-x', shadowX + 'px');
    root.style.setProperty('--hl-players-title-shadow-y', shadowY + 'px');
    return root;
  }

  function update(panel, state = {}) {
    const root = panel.element.querySelector('.hl-players') || build(panel);
    const list = root.querySelector('.hl-players__list');
    const count = root.querySelector('.hl-players__count');
    const players = Array.isArray(state.players) ? state.players : [];
    const started = Number(state.startedPlayers) || players.length;

    if (count) count.textContent = players.length + '/' + started;
    list.replaceChildren();
    players.forEach(player => list.appendChild(playerRow(player)));
    return root;
  }

  window.RTSHigherLowerPlayers = { build, update, applyAppearance };
})();
