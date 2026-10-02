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
  let editor = null;

  const getValue = (layout, id) => {
    if (id === 'board' || id === 'players') return layout[id];
    return layout.cards[id] || layout.elements[id];
  };

  const layoutControls = document.createElement('div');
  layoutControls.className = 'hl-layout-controls';
  layoutControls.innerHTML = '<span>Layout</span>';
  const layoutSelect = document.createElement('select');
  const saveLayoutButton = RTS.core.ui.button('Save Layout');
  const saveAsButton = RTS.core.ui.button('Save As');
  const deleteButton = RTS.core.ui.button('Delete');
  layoutControls.append(layoutSelect, saveLayoutButton, saveAsButton, deleteButton);
  section.appendChild(layoutControls);

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

  const saveAsLayout = () => {
    const name = window.prompt('Layout name:',
      RTSHigherLowerConfiguration.getActiveLayoutName());
    if (!name?.trim()) return;
    RTSHigherLowerConfiguration.saveLayout(
      extension.api.getLayout(), name.trim()
    );
  };

  const deleteLayout = () => {
    const name = layoutSelect.value;
    if (!name || !window.confirm('Delete layout "' + name + '"?')) return;
    RTSHigherLowerConfiguration.deleteLayout(name);
  };

  layoutSelect.addEventListener('change', () => {
    RTSHigherLowerConfiguration.activateLayout(layoutSelect.value);
  });
  saveLayoutButton.addEventListener('click', saveLayout);
  saveAsButton.addEventListener('click', saveAsLayout);
  deleteButton.addEventListener('click', deleteLayout);

  RTSHigherLowerConfiguration.onChange(() => {
    current = extension.api.getLayout();
    refreshLayoutList();
    editor?.refresh();
  });

  refreshLayoutList();

  const targets = [
    'board', 'players', 'previous', 'lower', 'deck', 'higher', 'round', 'totals'
  ].map(id => ({
    id,
    label: id,
    get: () => getValue(current, id),
    set: patch => {
      const next = RTSHigherLowerLayout.create(current);
      Object.assign(getValue(next, id), patch);
      current = extension.api.setLayout(next);
    }
  }));

  editor = RTS.core.positionEditor.mount(section, {
    title: 'Overlay Layout',
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
