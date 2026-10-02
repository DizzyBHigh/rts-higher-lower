(() => {
  const extension = RTS.getExtension('rts-higher-lower');
  const host = document.getElementById('extension-tools');
  if (!extension || !host || !RTS.core.ui || !RTS.core.positionEditor) return;

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
  section.className = 'extension-dev-tools';
  section.innerHTML = '<strong>RTS Higher Lower</strong>' +
    '<div class="actions">' +
    '<button data-action="state">Show Test State</button>' +
    '<button data-action="start">Start Game</button>' +
    '<button data-action="draw">Draw Card</button>' +
    '<button data-action="reset">Reset Layout</button>' +
    '</div>';
  host.appendChild(section);

  const settings = document.createElement('div');
  settings.className = 'hl-settings-editor';
  section.appendChild(settings);
  RTSHigherLowerSettings.render(settings);

  let current = extension.api.getLayout();

  const getValue = (layout, id) => {
    if (id === 'board' || id === 'players') return layout[id];
    return layout.cards[id] || layout.elements[id];
  };

  const saveConfiguration = () => {
    const configuration = JSON.parse(JSON.stringify(
      RTSHigherLowerConfiguration.current || {
        settings: {}, layout: {}, game: {}
      }
    ));
    configuration.layout = current;
    RTSHigherLowerConfiguration.save(configuration);
  };

  const targets = [
    'board', 'players', 'previous', 'lower', 'deck', 'higher', 'round', 'totals'
  ].map(id => ({
    id,
    label: id,
    get: () => getValue(current, id),
    set: (patch, options = {}) => {
      const next = RTSHigherLowerLayout.create(current);
      Object.assign(getValue(next, id), patch);
      current = extension.api.setLayout(next);
      if (!options.transient) saveConfiguration();
    }
  }));

  const editor = RTS.core.positionEditor.mount(section, {
    title: 'Overlay Layout',
    targets,
    onCommit: saveConfiguration
  });

  section.addEventListener('click', async event => {
    const action = event.target?.dataset?.action;
    if (!action) return;
    try {
      if (action === 'state') extension.api.updateState(state);
      if (action === 'start') extension.api.startGame(10);
      if (action === 'draw') await extension.api.drawCard();
      if (action === 'reset') {
        current = extension.api.setLayout(RTSHigherLowerLayout.create());
        saveConfiguration();
        editor.refresh();
      }
    } catch (error) {
      document.getElementById('log').textContent = error.message;
    }
  });
})();
