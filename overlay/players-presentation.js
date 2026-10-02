(() => {
  const canvas = { width: 1920, height: 1080 };

  function playerPosition(extension) {
    const board = extension.state.layout.board;
    const players = extension.state.layout.players;
    const boardScale = Number(board.scale) || 100;
    const scale = boardScale / 100;
    const localX = Number(players.x) || 0;
    const localY = Number(players.y) || 0;
    const localWidth = Number(players.width) || 0;
    const localHeight = Number(players.height) || 0;
    const boardWidth = Number(board.width) || 0;
    const boardHeight = Number(board.height) || 0;
    const dx = (localX + localWidth / 2 - boardWidth / 2) * scale;
    const dy = (localY + localHeight / 2 - boardHeight / 2) * scale;

    return {
      x: (Number(board.x) || 0) + dx / canvas.width * 100,
      y: (Number(board.y) || 0) - dy / canvas.height * 100,
      scale: (Number(players.scale) || 100) * scale
    };
  }

  function getPanel(extension) {
    if (extension.state.playersPanel) return extension.state.playersPanel;
    const panel = RTS.core.panels.create(
      'higher-lower-players',
      { positions: { Center: playerPosition(extension) } }
    );
    RTSHigherLowerPlayers.build(panel);
    extension.state.playersPanel = panel;
    applyLayout(extension);
    return panel;
  }

  function applyLayout(extension) {
    const panel = getPanel(extension);
    const value = extension.state.layout.players;
    panel.element.style.width = value.width + 'px';
    panel.element.style.height = value.height + 'px';
    panel.element.style.zIndex = String(value.z ?? 10);
    panel.runner.configure({ Center: playerPosition(extension) });
    panel.show(playerPosition(extension));
    return panel;
  }

  function update(extension, state = {}) {
    const panel = getPanel(extension);
    RTSHigherLowerPlayers.update(panel, state);
    applyLayout(extension);
    return panel;
  }

  window.RTSHigherLowerPlayersPresentation = {
    getPanel,
    applyLayout,
    update
  };
})();
