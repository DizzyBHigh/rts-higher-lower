(() => {
  const extension = RTS.getExtension('rts-higher-lower');
  if (!extension) return;

  const duration = () => {
    const value = Number(RTSHigherLowerConfiguration.current?.settings?.cardAnimation?.duration);
    return Number.isFinite(value) ? Math.max(0, value) : 500;
  };

  const easing = () =>
    RTSHigherLowerConfiguration.current?.settings?.cardAnimation?.easing || 'ease-in-out';

  const targets = extension => {
    const result = [];
    const panel = extension.state.panel?.element;
    const players = extension.state.playersPanel?.element;
    const selectors = '.hl-board,.hl-board__round,.hl-board__round-timer,' +
      '.hl-board__previous,.hl-board__higher,.hl-board__lower,.hl-board__deck,' +
      '.hl-board__round-total-label,.hl-board__round-total-value,' +
      '.hl-board__pot-total-label,.hl-board__pot-total-value';

    panel?.querySelectorAll(selectors).forEach(element => result.push(element));
    if (players) result.push(players);
    return result;
  };

  const snapshot = elements => elements.map(element => ({
    element,
    left: getComputedStyle(element).left,
    top: getComputedStyle(element).top,
    width: getComputedStyle(element).width,
    height: getComputedStyle(element).height
  }));

  const animate = before => {
    const time = duration();
    if (!time) return;

    before.forEach(item => {
      const element = item.element;
      const style = getComputedStyle(element);
      const animation = element.animate([
        { left: item.left, top: item.top, width: item.width, height: item.height },
        { left: style.left, top: style.top, width: style.width, height: style.height }
      ], { duration: time, easing: easing(), fill: 'none' });
      animation.onfinish = () => element.style.removeProperty('will-change');
      element.style.willChange = 'left, top, width, height';
    });
  };

  const originalSetLayout = extension.api.setLayout;
  extension.api.setLayout = value => {
    let next = value;
    if (typeof value === 'string') {
      const layouts = RTSHigherLowerConfiguration.getLayouts();
      next = layouts[value];
      if (!next) return extension.state.layout;
      extension.state.configuration = {
        ...(extension.state.configuration || {}),
        activeLayout: value
      };
    }

    const before = snapshot(targets(extension));
    const result = originalSetLayout(next);
    requestAnimationFrame(() => animate(before));
    return result;
  };

  const originalStartGame = extension.api.startGame;
  extension.api.startGame = rounds => {
    const configuration = RTSHigherLowerConfiguration.current;
    const settings = configuration?.settings || {};
    const layout = settings.defaultLayout;
    const brand = settings.defaultBrand;

    if ((layout && configuration.layouts?.[layout]) || (brand && configuration.brands?.[brand])) {
      extension.configure({
        ...configuration,
        activeLayout: layout && configuration.layouts?.[layout]
          ? layout : configuration.activeLayout,
        activeBrand: brand && configuration.brands?.[brand]
          ? brand : configuration.activeBrand
      });
    }

    return originalStartGame(rounds);
  };
})();
