const RTSHigherLowerRuntime = (() => {
  const getBrand = configuration => {
    const brands = configuration?.brands || {};
    const name = configuration?.activeBrand || Object.keys(brands)[0] || 'default';
    return brands[name] || configuration?.appearance || {};
  };
  function isGameVisible(game) { return game?.active === true || game?.state === 'playing' || game?.state === 'registration'; }
  function getGameLayoutName(configuration) {
    const value = configuration || {}, settings = value.settings || {}, layouts = value.layouts || {}, game = value.game || {};
    const preferred = isGameVisible(game) ? settings.showingLayout : settings.hiddenLayout;
    return preferred && layouts[preferred] ? preferred : value.activeLayout || Object.keys(layouts)[0] || 'default';
  }
  function getConfiguredLayout(configuration, name) {
    const value = configuration || {}, layouts = value.layouts || {};
    const selected = name && layouts[name] ? name : getGameLayoutName(value);
    return RTSHigherLowerLayout.create(layouts[selected] || value.layout);
  }
  function applyDefaults(configuration) {
    const value = { ...(configuration || {}) }, settings = value.settings || {}, layouts = value.layouts || {}, brands = value.brands || {};
    const layoutName = getGameLayoutName(value);
    if (layoutName && layouts[layoutName]) value.activeLayout = layoutName;
    if (settings.defaultBrand && brands[settings.defaultBrand]) value.activeBrand = settings.defaultBrand;
    return value;
  }
  function configure(extension, configuration) {
    const value = applyDefaults(configuration || {});
    extension.state.configuration = value;
    RTSHigherLowerTimer.stop(extension);
    const game = value.game || {};
    extension.state.layout = getConfiguredLayout(value, game.state === 'registration' ? value.settings?.hiddenLayout : getGameLayoutName(value));
    RTSHigherLowerRecovery.apply(extension, value);
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    RTSHigherLowerBoard.applyLayout(panel, extension.state.layout);
    RTSHigherLowerBoard.applyAppearance(panel, getBrand(value));
    RTSHigherLowerPlayersPresentation.update(extension, extension.state.board);
    RTSHigherLowerPlayers.applyAppearance(RTSHigherLowerPlayersPresentation.getPanel(extension), getBrand(value));
    RTSHigherLowerCardsPresentation.applyLayout(extension);
    if (game.state === 'registration') void startRegistration(extension, game.registrationStartedAt || Date.now());
  }
  async function startRegistration(extension, startedAt) {
    const configuration = extension.state.configuration || {};
    const hiddenLayout = getConfiguredLayout(configuration, configuration.settings?.hiddenLayout);
    const showingLayout = getConfiguredLayout(configuration, configuration.settings?.showingLayout);
    extension.state.layout = hiddenLayout;
    RTSHigherLowerBoard.applyLayout(RTSHigherLowerPresentation.getPanel(extension), hiddenLayout);
    RTSHigherLowerPlayersPresentation.applyLayout(extension);
    await RTSHigherLowerLayout.transition(extension, hiddenLayout, showingLayout);
    extension.state.layout = showingLayout;
    applyLayout(extension);
    RTSHigherLowerTimer.startRegistration(extension, startedAt);
    return true;
  }
  async function startGame(extension, rounds) {
    const configuration = extension.state.configuration || {};
    const hiddenLayout = getConfiguredLayout(configuration, configuration.settings?.hiddenLayout);
    const showingLayout = getConfiguredLayout(configuration, configuration.settings?.showingLayout);
    const state = extension.state.game.start(rounds, configuration.game?.players || [], configuration.game?.bonusPot || 0);
    configuration.game = state;
    extension.state.configuration = configuration;
    if (configuration.settings?.showingLayout && configuration.layouts?.[configuration.settings.showingLayout]) configuration.activeLayout = configuration.settings.showingLayout;
    RTSHigherLowerTimer.stop(extension);
    RTSHigherLowerPresentation.resetCards(extension);
    extension.state.layout = hiddenLayout;
    applyLayout(extension);
    await RTSHigherLowerLayout.transition(extension, hiddenLayout, showingLayout);
    extension.state.layout = showingLayout;
    applyLayout(extension);
    updateBoard(extension, { round: 0, players: state.players, startedPlayers: state.startedPlayers });
    await drawCard(extension);
    RTSHigherLowerPersistence.save(extension.state.game);
    return extension.state.game.state();
  }
  function resetGame(extension) {
    RTSHigherLowerTimer.stop(extension);
    const configuration = extension.state.configuration || {};
    const hiddenLayout = getConfiguredLayout(configuration, configuration.settings?.hiddenLayout);
    const from = RTSHigherLowerLayout.clone(extension.state.layout);
    extension.state.game.reset();
    extension.state.card = null;
    RTSHigherLowerPresentation.resetCards(extension);
    updateBoard(extension, { round: 0, players: [], roundTotal: 0, potTotal: 0, startedPlayers: 0 });
    void RTSHigherLowerLayout.transition(extension, from, hiddenLayout, () => {
      extension.state.layout = hiddenLayout;
      applyLayout(extension);
    });
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
    RTSHigherLowerPlayersPresentation.applyLayout(extension);
    RTSHigherLowerPlayers.applyAppearance(RTSHigherLowerPlayersPresentation.getPanel(extension), getBrand(extension.state.configuration));
    RTSHigherLowerCardsPresentation.applyLayout(extension);
  }
  function setLayout(extension, value, options = {}) {
    let layoutName = null, layoutValue = value;
    if (typeof value === 'string') { layoutName = value.trim(); layoutValue = extension.state.configuration?.layouts?.[layoutName]; if (!layoutValue) return extension.state.layout; }
    const from = RTSHigherLowerLayout.clone(extension.state.layout);
    const to = RTSHigherLowerLayout.create(RTSHigherLowerLayout.merge(extension.state.layout, layoutValue));
    extension.state.layout = to;
    if (layoutName && extension.state.configuration) extension.state.configuration.activeLayout = layoutName;
    if (options.instant) { applyLayout(extension); return to; }
    RTSHigherLowerLayout.transition(extension, from, to, () => applyLayout(extension));
    return to;
  }
  function updateBoard(extension, data) {
    extension.state.board = { ...extension.state.board, ...(data || {}) };
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    RTSHigherLowerBoard.update(panel, extension.state.board);
    RTSHigherLowerBoard.applyLayout(panel, extension.state.layout);
    RTSHigherLowerBoard.applyAppearance(panel, getBrand(extension.state.configuration));
    RTSHigherLowerPlayersPresentation.update(extension, extension.state.board);
    RTSHigherLowerPlayers.applyAppearance(RTSHigherLowerPlayersPresentation.getPanel(extension), getBrand(extension.state.configuration));
  }
  return { configure, startRegistration, startGame, resetGame, drawCard, setLayout, updateBoard };
})();
