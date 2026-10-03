const RTSHigherLowerRuntime = (() => {
  const getBrand = configuration => {
    const brands = configuration?.brands || {};
    const name = configuration?.activeBrand || Object.keys(brands)[0] || 'default';
    return brands[name] || configuration?.appearance || {};
  };

  function getGameLayoutName(configuration) {
    const value = configuration || {};
    const settings = value.settings || {};
    const layouts = value.layouts || {};
    const state = value.game?.state;
    const preferred = state === 'playing' ? settings.showingLayout : settings.hiddenLayout;
    return preferred && layouts[preferred] ? preferred : value.activeLayout || Object.keys(layouts)[0] || 'default';
  }

  function applyDefaults(configuration) {
    const value = { ...(configuration || {}) };
    const settings = value.settings || {};
    const layouts = value.layouts || {};
    const brands = value.brands || {};
    const layoutName = getGameLayoutName(value);
    if (layoutName && layouts[layoutName]) value.activeLayout = layoutName;
    if (settings.defaultBrand && brands[settings.defaultBrand]) value.activeBrand = settings.defaultBrand;
    return value;
  }

  function configure(extension, configuration) {
    const value = applyDefaults(configuration || {});
    extension.state.configuration = value;
    RTSHigherLowerTimer.stop(extension);
    extension.state.layout = RTSHigherLowerLayout.fromConfiguration(value);
    RTSHigherLowerRecovery.apply(extension, value);
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    RTSHigherLowerBoard.applyLayout(panel, extension.state.layout);
    RTSHigherLowerBoard.applyAppearance(panel, getBrand(value));
    const game = value.game || {};
    if (game.state === 'playing') RTSHigherLowerPresentation.show(extension);
    else RTSHigherLowerPresentation.hide(extension);
    RTSHigherLowerPlayersPresentation.update(extension, extension.state.board);
    RTSHigherLowerPlayers.applyAppearance(RTSHigherLowerPlayersPresentation.getPanel(extension), getBrand(value));
    RTSHigherLowerCardsPresentation.applyLayout(extension);
    if (game.state === 'registration' && game.registrationStartedAt)
      RTSHigherLowerTimer.startRegistration(extension, game.registrationStartedAt);
  }

  async function startGame(extension, rounds) {
    if (extension.state.configuration) configure(extension, applyDefaults(extension.state.configuration));
    const players = extension.state.configuration?.game?.players || [];
    const bonusPot = extension.state.configuration?.game?.bonusPot || 0;
    const state = extension.state.game.start(rounds, players, bonusPot);
    RTSHigherLowerTimer.stop(extension);
    RTSHigherLowerPresentation.resetCards(extension);
    RTSHigherLowerPresentation.show(extension);
    updateBoard(extension, { round: 0, players: state.players, startedPlayers: state.startedPlayers });
    await drawCard(extension);
    RTSHigherLowerPersistence.save(extension.state.game);
    return extension.state.game.state();
  }

  function resetGame(extension) {
    RTSHigherLowerTimer.stop(extension);
    extension.state.game.reset();
    extension.state.card = null;
    RTSHigherLowerPresentation.resetCards(extension);
    updateBoard(extension, { round: 0, players: [], roundTotal: 0, potTotal: 0, startedPlayers: 0 });
    RTSHigherLowerPresentation.hide(extension);
    return true;
  }

  async function drawCard(extension) {
    const result = extension.state.game.draw();
    extension.state.card = result.card || null;
    if (!result.card) { RTSHigherLowerTimer.stop(extension); return result; }
    updateBoard(extension, { round: result.round });
    await RTSHigherLowerPresentation.presentDraw(extension, result);
    RTSHigherLowerTimer.start(extension);
    RTSHigherLowerPersistence.save(extension.state.game);
    if (result.type !== 'first-card') RTSHigherLowerCommands.reportResult(extension, result);
    return result;
  }

  function applyLayout(extension) {
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    RTSHigherLowerBoard.applyLayout(panel, extension.state.layout);
    RTSHigherLowerBoard.applyAppearance(panel, getBrand(extension.state.configuration));
    if (extension.state.configuration?.game?.state === 'playing') RTSHigherLowerPresentation.show(extension);
    else RTSHigherLowerPresentation.hide(extension);
    RTSHigherLowerPlayersPresentation.applyLayout(extension);
    RTSHigherLowerPlayers.applyAppearance(RTSHigherLowerPlayersPresentation.getPanel(extension), getBrand(extension.state.configuration));
    RTSHigherLowerCardsPresentation.applyLayout(extension);
  }

  function setLayout(extension, value) {
    let layoutName = null;
    let layoutValue = value;
    if (typeof value === 'string') {
      layoutName = value.trim();
      layoutValue = extension.state.configuration?.layouts?.[layoutName];
      if (!layoutValue) return extension.state.layout;
    }
    const from = RTSHigherLowerLayout.clone(extension.state.layout);
    const to = RTSHigherLowerLayout.create(RTSHigherLowerLayout.merge(extension.state.layout, layoutValue));
    extension.state.layout = to;
    if (layoutName && extension.state.configuration) extension.state.configuration.activeLayout = layoutName;
    RTSHigherLowerLayout.transition(extension, from, to, () => applyLayout(extension));
    return to;
  }

  function updateBoard(extension, data) {
    extension.state.board = { ...extension.state.board, ...(data || {}) };
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    RTSHigherLowerBoard.update(panel, extension.state.board);
    RTSHigherLowerBoard.applyLayout(panel, extension.state.layout);
    RTSHigherLowerBoard.applyAppearance(panel, getBrand(extension.state.configuration));
    if (extension.state.configuration?.game?.state === 'playing') RTSHigherLowerPresentation.show(extension);
    else RTSHigherLowerPresentation.hide(extension);
    RTSHigherLowerPlayersPresentation.update(extension, extension.state.board);
    RTSHigherLowerPlayers.applyAppearance(RTSHigherLowerPlayersPresentation.getPanel(extension), getBrand(extension.state.configuration));
  }

  return { configure, startGame, resetGame, drawCard, setLayout, updateBoard };
})();
