(() => {
  function position(layout) {
    const value = layout?.players || {};
    return {
      x: Number(value.x) || 0,
      y: Number(value.y) || 0,
      z: Number(value.z) || 0,
      scaleX: Number(value.scale) || 100,
      scaleY: Number(value.scale) || 100
    };
  }

  function getPanel(extension) {
    if (extension.state.playersPanel) return extension.state.playersPanel;
    const panel = RTS.core.panels.create(
      'higher-lower-players', { positions: { Center: position(extension.state.layout) } }
    );
    RTSHigherLowerPlayers.build(panel);
    applyLayout(extension);
    return panel;
  }

  function applyLayout(extension) {
    const panel = getPanel(extension);
    const value = extension.state.layout.players;
    panel.element.style.width = value.width + 'px';
    panel.element.style.height = value.height + 'px';
    panel.element.style.zIndex = String(value.z ?? 10);
    panel.runner.configure({ Center: position(extension.state.layout) });
    return panel;
  }

  function show(extension, fromLayout = null) {
    const panel = getPanel(extension);
    const from = position(fromLayout || extension.state.layout);
    const target = position(extension.state.layout);
    const settings = extension.state.configuration?.settings || {};
    const animation = settings.panelAnimation || settings.cardAnimation || {};
    const duration = Math.max(0, Number(animation.duration) || 500);
    const easing = animation.easing || 'ease-in-out';

    panel.show(from);
    if (JSON.stringify(from) === JSON.stringify(target)) return panel;
    panel.runner.transition(from, target, duration, easing);
    return panel;
  }

  function hide(extension) {
    const panel = getPanel(extension);
    panel.hide();
    return panel;
  }

  function update(extension, state = {}) {
    const panel = getPanel(extension);
    RTSHigherLowerPlayers.update(panel, state);
    applyLayout(extension);
    return panel;
  }

  window.RTSHigherLowerPlayersPresentation = {
    getPanel, applyLayout, show, hide, update
  };
})();
