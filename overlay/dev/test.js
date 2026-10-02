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
  section.className = 'extension-dev-tools';
  section.innerHTML =
    '<strong>RTS Higher Lower</strong>' +
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

  const layout = document.createElement('div');
  layout.className = 'hl-layout-editor';
  const heading = document.createElement('strong');
  heading.textContent = 'Overlay Layout';
  layout.appendChild(heading);
  section.appendChild(layout);

  const target = RTS.core.ui.positionSelector({
    options: [
      'board', 'players', 'previous', 'lower', 'deck', 'higher',
      'round', 'totals'
    ],
    value: 'board'
  });
  layout.append(RTS.core.ui.field('Target', target));

  let current = extension.api.getLayout();

  const getValue = () => {
    if (target.value === 'board') return current.board;
    if (target.value === 'players') return current.players;
    if (current.cards[target.value]) return current.cards[target.value];
    return current.elements[target.value];
  };

  const apply = patch => {
    const next = RTSHigherLowerLayout.create(current);
    const item = target.value === 'board'
      ? next.board
      : target.value === 'players'
        ? next.players
        : next.cards[target.value] || next.elements[target.value];
    Object.assign(item, patch);
    current = extension.api.setLayout(next);
    saveConfiguration();
    showTarget();
  };

  const showTarget = () => {
    const panel = extension.state.panel;
    const root = panel?.element?.querySelector('.hl-board');
    if (!root) return;

    let marker = root.querySelector('.hl-layout-target');
    if (!marker) {
      marker = document.createElement('div');
      marker.className = 'hl-layout-target';
      root.appendChild(marker);
    }

    const value = getValue();
    marker.dataset.target = target.value;
    marker.style.left = value.x + 'px';
    marker.style.top = value.y + 'px';
    marker.style.width = value.width + 'px';
    marker.style.height = value.height + 'px';
    marker.textContent = target.value;
  };

  const render = () => {
    layout.querySelectorAll('.hl-shared-fields').forEach(node => node.remove());
    const value = getValue();
    const fields = document.createElement('div');
    fields.className = 'hl-shared-fields';
    const position = RTS.core.ui.positionEditor({
      fields: target.value === 'board' ? ['x', 'y', 'scale'] : ['x', 'y'],
      value,
      onChange: next => apply(next)
    });
    fields.append(RTS.core.ui.field('Position', position));
    const ratio = RTS.core.ui.aspectRatio({
      width: value.width,
      height: value.height,
      onChange: (width, height) => apply({ width, height })
    });
    fields.append(RTS.core.ui.field('Size', ratio));
    layout.appendChild(fields);
    showTarget();
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

  target.addEventListener('change', render);

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
        render();
      }
    } catch (error) {
      document.getElementById('log').textContent = error.message;
    }
  });

  render();
})();
