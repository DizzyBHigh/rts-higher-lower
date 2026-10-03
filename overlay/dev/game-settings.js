(() => {
  const settings = document.querySelector('.hl-settings-editor');
  const game = settings?.querySelector('.rts-ui-section');
  if (!game || !window.RTSHigherLowerConfiguration) return;

  const clone = value => JSON.parse(JSON.stringify(value));
  const field = (label, control) => RTS.core.ui.field(label, control);

  const layout = RTS.core.ui.dropdown({ options: ['default'], value: 'default' });
  const brand = RTS.core.ui.dropdown({ options: ['default'], value: 'default' });

  const save = () => {
    const current = clone(RTSHigherLowerConfiguration.current || {});
    current.settings = {
      ...(current.settings || {}),
      defaultLayout: layout.value || 'default',
      defaultBrand: brand.value || 'default'
    };
    RTSHigherLowerConfiguration.save(current);
  };

  const refresh = configuration => {
    const value = configuration || {};
    const layouts = Object.keys(value.layouts || { default: {} });
    const brands = Object.keys(value.brands || { default: {} });
    const defaults = value.settings || {};

    layout.replaceChildren(...layouts.map(name =>
      RTS.core.ui.el('option', { value: name, text: name })
    ));
    brand.replaceChildren(...brands.map(name =>
      RTS.core.ui.el('option', { value: name, text: name })
    ));

    layout.value = defaults.defaultLayout && layouts.includes(defaults.defaultLayout)
      ? defaults.defaultLayout : layouts[0];
    brand.value = defaults.defaultBrand && brands.includes(defaults.defaultBrand)
      ? defaults.defaultBrand : brands[0];
  };

  layout.addEventListener('change', save);
  brand.addEventListener('change', save);

  game.append(
    field('Default Layout', layout),
    field('Default Brand', brand)
  );

  RTSHigherLowerConfiguration.onChange(refresh);
  RTSHigherLowerConfiguration.onReady(refresh);
})();
