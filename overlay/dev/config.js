(() => {
  const extension = RTS.getExtension('rts-higher-lower');
  const host = document.getElementById('extension-tools');
  if (!extension || !host || !RTS.core.ui || !RTS.core.positionEditor) return;

  const section = document.createElement('section');
  section.className = 'hl-dev';
  section.innerHTML = '<strong>RTS Higher Lower Configuration</strong>';
  host.appendChild(section);

  const settings = document.createElement('div');
  settings.className = 'hl-dev__settings';
  const settingsApi = RTSHigherLowerSettings.render(settings);
  section.appendChild(settings);
  const gameSettings = settings.querySelector('.rts-ui-section');
  const defaultBrand = RTS.core.ui.dropdown({ options: ['default'], value: 'default' });
  const showingLayout = RTS.core.ui.dropdown({ options: ['default'], value: 'default' });
  const hiddenLayout = RTS.core.ui.dropdown({ options: ['default'], value: 'default' });

  const refreshDefaults = configuration => {
    const value = configuration || {};
    const layouts = Object.keys(value.layouts || { default: {} });
    const brands = Object.keys(value.brands || { default: {} });
    const settingsValue = value.settings || {};
    const setDropdown = (select, selected) => {
      select.replaceChildren(...layouts.map(name => RTS.core.ui.el('option', { value: name, text: name })));
      select.value = layouts.includes(selected) ? selected : layouts[0];
    };
    setDropdown(showingLayout, settingsValue.showingLayout);
    setDropdown(hiddenLayout, settingsValue.hiddenLayout);
    defaultBrand.replaceChildren(...brands.map(name => RTS.core.ui.el('option', { value: name, text: name })));
    defaultBrand.value = brands.includes(settingsValue.defaultBrand) ? settingsValue.defaultBrand : brands[0];
  };

  if (gameSettings) {
    gameSettings.insertBefore(RTS.core.ui.field('Default Brand', defaultBrand), gameSettings.lastElementChild);
    gameSettings.insertBefore(RTS.core.ui.field('Game Layout', showingLayout), gameSettings.lastElementChild);
    gameSettings.insertBefore(RTS.core.ui.field('Hidden Layout', hiddenLayout), gameSettings.lastElementChild);
  }

  const originalSave = RTSHigherLowerConfiguration.save;
  RTSHigherLowerConfiguration.save = configuration => {
    configuration.settings = {
      ...(configuration.settings || {}),
      defaultBrand: defaultBrand.value || 'default',
      showingLayout: showingLayout.value || 'default',
      hiddenLayout: hiddenLayout.value || 'default'
    };
    return originalSave(configuration);
  };
  RTSHigherLowerConfiguration.onChange(refreshDefaults);
  RTSHigherLowerConfiguration.onReady(refreshDefaults);

  let current = extension.api.getLayout();
  let editor = null;
  let labelsVisible = true;
  const getValue = (layout, id) => id === 'board' || id === 'players' ? layout[id] : layout.cards[id] || layout.elements[id];

  const layoutSection = RTS.core.ui.section('Overlay Layout');
  settings.insertBefore(layoutSection, settingsApi.brandSection);
  const layoutControls = document.createElement('div');
  layoutControls.className = 'hl-dev__layout-controls';
  const layoutLabel = RTS.core.ui.el('span', { className: 'rts-position-control-title', text: 'Layout' });
  const layoutSelect = RTS.core.ui.positionSelector({ options: [], value: '' });
  const newLayoutButton = RTS.core.ui.button('New Layout');
  const deleteButton = RTS.core.ui.button('Delete');
  const labelButton = RTS.core.ui.button('Hide Labels', { onClick: () => {
    labelsVisible = !labelsVisible;
    document.querySelectorAll('.rts-position-marker').forEach(marker => marker.classList.toggle('hide-label', !labelsVisible));
    labelButton.textContent = labelsVisible ? 'Hide Labels' : 'Show Labels';
  }});
  layoutControls.append(layoutLabel, layoutSelect, newLayoutButton, deleteButton, labelButton);
  layoutSection.appendChild(layoutControls);

  const refreshLayoutList = () => {
    const layouts = RTSHigherLowerConfiguration.getLayouts();
    const selected = layoutSelect.value;
    layoutSelect.innerHTML = '';
    Object.keys(layouts).sort().forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      layoutSelect.appendChild(option);
    });
    const active = RTSHigherLowerConfiguration.getActiveLayoutName();
    layoutSelect.value = layouts[selected] ? selected : active;
    deleteButton.disabled = layoutSelect.options.length <= 1;
  };

  const saveLayout = () => {
    const name = layoutSelect.value;
    return name ? RTSHigherLowerConfiguration.saveLayout(extension.api.getLayout(), name) : false;
  };
  const newLayout = () => {
    const name = window.prompt('New layout name:', '');
    if (!name?.trim()) return;
    const layoutName = name.trim();
    if (RTSHigherLowerConfiguration.getLayouts()[layoutName]) return window.alert('A layout with that name already exists.');
    RTSHigherLowerConfiguration.createLayout(extension.api.getLayout(), layoutName);
  };
  const deleteLayout = () => {
    const name = layoutSelect.value;
    if (!name || !window.confirm('Delete layout "' + name + '"?')) return;
    RTSHigherLowerConfiguration.deleteLayout(name);
  };

  layoutSelect.addEventListener('change', () => {
    const name = layoutSelect.value;
    if (!name) return;
    const layouts = RTSHigherLowerConfiguration.getLayouts();
    if (!layouts[name]) return;
    current = extension.api.setLayout(RTSHigherLowerLayout.create(layouts[name]), { show: true, instant: true });
    editor?.refresh();
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
    board: 'Board', players: 'Players Panel', previous: 'Previous Card Position', higher: 'Higher Card Position',
    lower: 'Lower Card Position', deck: 'Deck Position', round: 'Current Round Title', roundTimer: 'Round Timer',
    roundTotalLabel: 'Round Total Label', roundTotalValue: 'Round Total Value', potTotalLabel: 'Pot Total Label', potTotalValue: 'Pot Total Value'
  };
  const targetIds = ['board', 'players', 'previous', 'higher', 'lower', 'deck', 'round', 'roundTimer', 'roundTotalLabel', 'roundTotalValue', 'potTotalLabel', 'potTotalValue'];
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

  editor = RTS.core.positionEditor.mount(layoutSection, { title: '', targets, onSave: saveLayout });
  RTSOverlaySocket.onEvent(message => {
    const args = message?.data?.args ?? message?.args;
    if (args?.rtsHigherLowerSaveStatus) editor.setSaveStatus(args.rtsHigherLowerSaveStatus);
  });
})();
