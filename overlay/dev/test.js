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
  section.innerHTML = '<strong>RTS Higher Lower</strong>';
  host.appendChild(section);

  const actions = document.createElement('div');
  actions.className = 'actions';
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

  const settings = document.createElement('div');
  settings.className = 'hl-settings-editor';
  const settingsApi = RTSHigherLowerSettings.render(settings);
  section.appendChild(settings);

  let current = extension.api.getLayout();
  let editor = null;
  let labelsVisible = true;

  const getValue = (layout, id) => {
    if (id === 'board' || id === 'players') return layout[id];
    return layout.cards[id] || layout.elements[id];
  };

  const layoutSection = RTS.core.ui.section('Overlay Layout');
  settings.appendChild(layoutSection);

  const layoutControls = document.createElement('div');
  layoutControls.className = 'hl-layout-controls';
  const layoutLabel = RTS.core.ui.el('span', {
    className: 'rts-position-control-title',
    text: 'Layout'
  });
  const layoutSelect = RTS.core.ui.positionSelector({ options: [], value: '' });
  const newLayoutButton = RTS.core.ui.button('New Layout');
  const deleteButton = RTS.core.ui.button('Delete');
  const labelButton = RTS.core.ui.button('Hide Labels', {
    onClick: () => {
      labelsVisible = !labelsVisible;
      document.querySelectorAll('.rts-position-marker').forEach(marker =>
        marker.classList.toggle('hide-label', !labelsVisible)
      );
      labelButton.textContent = labelsVisible ? 'Hide Labels' : 'Show Labels';
    }
  });
  layoutControls.append(layoutLabel, layoutSelect, newLayoutButton, deleteButton, labelButton);
  layoutSection.appendChild(layoutControls);

  const refreshLayoutList = () => {
    const active = RTSHigherLowerConfiguration.getActiveLayoutName();
    const layouts = RTSHigherLowerConfiguration.getLayouts();
    layoutSelect.innerHTML = '';
    Object.keys(layouts).sort().forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      layoutSelect.appendChild(option);
    });
    layoutSelect.value = active;
    deleteButton.disabled = layoutSelect.options.length <= 1;
  };

  const saveLayout = () =>
    RTSHigherLowerConfiguration.saveLayout(extension.api.getLayout());

  const newLayout = () => {
    const name = window.prompt('New layout name:', '');
    if (!name?.trim()) return;
    const layoutName = name.trim();
    if (RTSHigherLowerConfiguration.getLayouts()[layoutName]) {
      window.alert('A layout with that name already exists.');
      return;
    }
    RTSHigherLowerConfiguration.createLayout(extension.api.getLayout(), layoutName);
  };

  const deleteLayout = () => {
    const name = layoutSelect.value;
    if (!name || !window.confirm('Delete layout "' + name + '"?')) return;
    RTSHigherLowerConfiguration.deleteLayout(name);
  };

  layoutSelect.addEventListener('change', () => {
    RTSHigherLowerConfiguration.activateLayout(layoutSelect.value);
  });
  newLayoutButton.addEventListener('click', newLayout);
  deleteButton.addEventListener('click', deleteLayout);

  RTSHigherLowerConfiguration.onChange(() => {
    current = extension.api.getLayout();
    refreshLayoutList();
    editor?.refresh();
  });

  refreshLayoutList();

  const targetLabels = {
    board: 'Board',
    players: 'Players Panel',
    previous: 'Previous Card Position',
    higher: 'Higher Card Position',
    lower: 'Lower Card Position',
    deck: 'Deck Position',
    round: 'Current Round Title',
    roundTimer: 'Round Timer',
    roundTotalLabel: 'Round Total Label',
    roundTotalValue: 'Round Total Value',
    potTotalLabel: 'Pot Total Label',
    potTotalValue: 'Pot Total Value'
  };

  const targetIds = [
    'board', 'players', 'previous', 'higher', 'lower', 'deck',
    'round', 'roundTimer', 'roundTotalLabel', 'roundTotalValue',
    'potTotalLabel', 'potTotalValue'
  ];

  const targets = targetIds.map(id => ({
    id,
    label: targetLabels[id],
    get: () => getValue(current, id),
    set: patch => {
      const next = RTSHigherLowerLayout.create(current);
      Object.assign(getValue(next, id), patch);
      current = extension.api.setLayout(next);
    }
  }));

  editor = RTS.core.positionEditor.mount(layoutSection, {
    title: '',
    targets,
    onSave: saveLayout
  });

  RTSOverlaySocket.onEvent(message => {
    const args = message?.data?.args ?? message?.args;
    if (args?.rtsHigherLowerSaveStatus)
      editor.setSaveStatus(args.rtsHigherLowerSaveStatus);
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
        editor.refresh();
      }
    } catch (error) {
      document.getElementById('log').textContent = error.message;
    }
  });
})();