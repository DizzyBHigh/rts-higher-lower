(() => {
  const defaultBrand = {
    fontFamily: 'Arial',
    board: {
      color1: '#d8c79e', color2: '#d8c79e', gradientDirection: 90,
      borderWidth: 10, borderColor: '#6f5a3c', cornerRadius: 28
    },
    round: { fontSize: 34, color: '#30291f', shadowColor: '#000000', shadowDirection: 0 },
    roundTotal: { fontSize: 24, color: '#30291f', shadowColor: '#000000', shadowDirection: 0 },
    potTotal: { fontSize: 24, color: '#30291f', shadowColor: '#000000', shadowDirection: 0 }
  };

  const defaults = {
    settings: {
      defaultRounds: 10,
      roundLength: 60000,
      cardAnimation: { duration: 500, easing: 'ease-in-out' }
    },
    brands: { default: defaultBrand },
    activeBrand: 'default'
  };

  const fonts = [
    'Arial', 'Verdana', 'Trebuchet MS', 'Georgia', 'Times New Roman',
    'Courier New', 'Impact', 'system-ui', 'sans-serif'
  ];

  const number = (value, fallback, min = 0, max = 999) => {
    const next = Number(value);
    if (!Number.isFinite(next)) return fallback;
    return Math.min(max, Math.max(min, next));
  };

  const clone = value => JSON.parse(JSON.stringify(value));

  const normaliseBrands = configuration => {
    const value = configuration || {};
    if (value.brands && Object.keys(value.brands).length)
      return value;

    const brand = value.appearance || clone(defaultBrand);
    value.brands = { default: clone(brand) };
    value.activeBrand = 'default';
    delete value.appearance;
    return value;
  };

  const setOptions = (select, options, value) => {
    select.replaceChildren(...options.map(name =>
      RTS.core.ui.el('option', { value: name, text: name })
    ));
    select.value = value || options[0] || '';
  };

  const Settings = {
    render(host) {
      if (!host || !RTS.core.ui) return null;

      const brandSection = RTS.core.ui.section('Brand Presets');
      const brand = RTS.core.ui.dropdown({ options: ['default'], value: 'default' });
      const newBrand = RTS.core.ui.button('New Brand', {
        variant: 'blue',
        onClick: () => {
          const name = window.prompt('Brand name');
          if (!name?.trim()) return;
          const configuration = normaliseBrands(clone(
            RTSHigherLowerConfiguration.current || defaults
          ));
          if (!RTSHigherLowerConfiguration.createBrand(
            configuration.brands[configuration.activeBrand || 'default'] || defaultBrand,
            name.trim()
          )) return;
        }
      });
      const deleteBrand = RTS.core.ui.button('Delete', {
        onClick: () => RTSHigherLowerConfiguration.deleteBrand(brand.value)
      });
      brand.addEventListener('change', () =>
        RTSHigherLowerConfiguration.activateBrand(brand.value)
      );
      brandSection.append(
        RTS.core.ui.field('Brand', brand),
        newBrand,
        deleteBrand
      );

      const game = RTS.core.ui.section('Game Settings');
      const rounds = RTS.core.ui.number({ value: 10, min: 1, step: 1 });
      const length = RTS.core.ui.dropdown({
        options: ['1 Minute', '30 Seconds'], value: '1 Minute'
      });

      const overlay = RTS.core.ui.section('Overlay Settings');
      const duration = RTS.core.ui.number({ value: 500, min: 0, step: 50 });
      const easing = RTS.core.ui.dropdown({
        options: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'],
        value: 'ease-in-out'
      });

      const fontSettings = RTS.core.ui.section('Font Settings');
      const font = RTS.core.ui.fontSelector({ options: fonts, value: 'Arial' });
      fontSettings.append(RTS.core.ui.field('Font Selector', font));

      const board = RTS.core.ui.section('Background Board');
      const boardColor1 = RTS.core.ui.color({ value: '#d8c79e' });
      const boardColor2 = RTS.core.ui.color({ value: '#d8c79e' });
      const gradientDirection = RTS.core.ui.angle({ value: 90 });
      const borderWidth = RTS.core.ui.number({ value: 10, min: 0, max: 100, step: 1 });
      const borderColor = RTS.core.ui.color({ value: '#6f5a3c' });
      const cornerRadius = RTS.core.ui.number({ value: 28, min: 0, max: 200, step: 1 });

      const round = RTS.core.ui.section('Round Information');
      const roundSize = RTS.core.ui.number({ value: 34, min: 1, max: 200, step: 1 });
      const roundColor = RTS.core.ui.color({ value: '#30291f' });
      const roundShadow = RTS.core.ui.color({ value: '#000000' });
      const roundShadowDirection = RTS.core.ui.angle({ value: 0 });

      const roundTotal = RTS.core.ui.section('Round Total');
      const roundTotalSize = RTS.core.ui.number({ value: 24, min: 1, max: 200, step: 1 });
      const roundTotalColor = RTS.core.ui.color({ value: '#30291f' });
      const roundTotalShadow = RTS.core.ui.color({ value: '#000000' });
      const roundTotalShadowDirection = RTS.core.ui.angle({ value: 0 });

      const potTotal = RTS.core.ui.section('Pot Total');
      const potTotalSize = RTS.core.ui.number({ value: 24, min: 1, max: 200, step: 1 });
      const potTotalColor = RTS.core.ui.color({ value: '#30291f' });
      const potTotalShadow = RTS.core.ui.color({ value: '#000000' });
      const potTotalShadowDirection = RTS.core.ui.angle({ value: 0 });

      const status = RTS.core.ui.el('small', { className: 'hl-settings-status' });
      const save = RTS.core.ui.button('Save Settings', {
        variant: 'blue',
        onClick: () => {
          const configuration = normaliseBrands(clone(
            RTSHigherLowerConfiguration.current || defaults
          ));
          const activeBrand = brand.value || 'default';
          configuration.activeBrand = activeBrand;
          configuration.brands[activeBrand] = collectBrand();
          configuration.settings = {
            defaultRounds: Math.max(1, Number(rounds.value) || 10),
            roundLength: length.value === '30 Seconds' ? 30000 : 60000,
            cardAnimation: {
              duration: Math.max(0, Number(duration.value) || 500),
              easing: easing.value || 'ease-in-out'
            }
          };
          delete configuration.appearance;
          status.textContent = 'Saving...';
          RTSHigherLowerConfiguration.save(configuration);
        }
      });

      const collectBrand = () => ({
        fontFamily: font.value || 'Arial',
        board: {
          color1: boardColor1.value,
          color2: boardColor2.value,
          gradientDirection: gradientDirection.getValue(),
          borderWidth: number(borderWidth.value, 10, 0, 100),
          borderColor: borderColor.value,
          cornerRadius: number(cornerRadius.value, 28, 0, 200)
        },
        round: {
          fontSize: number(roundSize.value, 34, 1, 200),
          color: roundColor.value,
          shadowColor: roundShadow.value,
          shadowDirection: roundShadowDirection.getValue()
        },
        roundTotal: {
          fontSize: number(roundTotalSize.value, 24, 1, 200),
          color: roundTotalColor.value,
          shadowColor: roundTotalShadow.value,
          shadowDirection: roundTotalShadowDirection.getValue()
        },
        potTotal: {
          fontSize: number(potTotalSize.value, 24, 1, 200),
          color: potTotalColor.value,
          shadowColor: potTotalShadow.value,
          shadowDirection: potTotalShadowDirection.getValue()
        }
      });

      game.append(
        RTS.core.ui.field('Default Rounds', rounds),
        RTS.core.ui.field('Round Length', length)
      );
      overlay.append(
        RTS.core.ui.field('Card Duration', duration),
        RTS.core.ui.field('Card Easing', easing),
        save,
        status
      );
      board.append(
        RTS.core.ui.field('Colour 1', boardColor1),
        RTS.core.ui.field('Colour 2', boardColor2),
        RTS.core.ui.field('Gradient Direction', gradientDirection),
        RTS.core.ui.field('Border Width', borderWidth),
        RTS.core.ui.field('Border Colour', borderColor),
        RTS.core.ui.field('Corner Radius', cornerRadius)
      );
      round.append(
        RTS.core.ui.field('Font Size', roundSize),
        RTS.core.ui.field('Colour', roundColor),
        RTS.core.ui.field('Shadow Colour', roundShadow),
        RTS.core.ui.field('Shadow Direction', roundShadowDirection)
      );
      roundTotal.append(
        RTS.core.ui.field('Font Size', roundTotalSize),
        RTS.core.ui.field('Colour', roundTotalColor),
        RTS.core.ui.field('Shadow Colour', roundTotalShadow),
        RTS.core.ui.field('Shadow Direction', roundTotalShadowDirection)
      );
      potTotal.append(
        RTS.core.ui.field('Font Size', potTotalSize),
        RTS.core.ui.field('Colour', potTotalColor),
        RTS.core.ui.field('Shadow Colour', potTotalShadow),
        RTS.core.ui.field('Shadow Direction', potTotalShadowDirection)
      );
      host.append(brandSection, game, overlay, fontSettings, board, round, roundTotal, potTotal);

      const apply = configuration => {
        const value = normaliseBrands(clone(configuration || defaults));
        const gameSettings = value.settings || defaults.settings;
        const animation = gameSettings.cardAnimation || defaults.settings.cardAnimation;
        const brands = value.brands || { default: defaultBrand };
        const activeBrand = value.activeBrand || Object.keys(brands)[0] || 'default';
        const appearance = brands[activeBrand] || defaultBrand;
        const boardSettings = appearance.board || defaultBrand.board;
        const roundSettings = appearance.round || defaultBrand.round;
        const roundTotalSettings = appearance.roundTotal || defaultBrand.roundTotal;
        const potTotalSettings = appearance.potTotal || defaultBrand.potTotal;

        setOptions(brand, Object.keys(brands), activeBrand);
        rounds.value = Number(gameSettings.defaultRounds) || 10;
        length.value = Number(gameSettings.roundLength) === 30000 ? '30 Seconds' : '1 Minute';
        duration.value = Math.max(0, Number(animation.duration) || 500);
        easing.value = animation.easing || 'ease-in-out';
        font.value = appearance.fontFamily || 'Arial';
        boardColor1.value = boardSettings.color1 || '#d8c79e';
        boardColor2.value = boardSettings.color2 || '#d8c79e';
        gradientDirection.setValue(boardSettings.gradientDirection ?? 90);
        borderWidth.value = number(boardSettings.borderWidth, 10, 0, 100);
        borderColor.value = boardSettings.borderColor || '#6f5a3c';
        cornerRadius.value = number(boardSettings.cornerRadius, 28, 0, 200);
        roundSize.value = number(roundSettings.fontSize, 34, 1, 200);
        roundColor.value = roundSettings.color || '#30291f';
        roundShadow.value = roundSettings.shadowColor || '#000000';
        roundShadowDirection.setValue(roundSettings.shadowDirection ?? 0);
        roundTotalSize.value = number(roundTotalSettings.fontSize, 24, 1, 200);
        roundTotalColor.value = roundTotalSettings.color || '#30291f';
        roundTotalShadow.value = roundTotalSettings.shadowColor || '#000000';
        roundTotalShadowDirection.setValue(roundTotalSettings.shadowDirection ?? 0);
        potTotalSize.value = number(potTotalSettings.fontSize, 24, 1, 200);
        potTotalColor.value = potTotalSettings.color || '#30291f';
        potTotalShadow.value = potTotalSettings.shadowColor || '#000000';
        potTotalShadowDirection.setValue(potTotalSettings.shadowDirection ?? 0);
      };

      RTSHigherLowerConfiguration.onChange(configuration => {
        apply(configuration);
        status.textContent = 'Saved.';
      });

      apply(RTSHigherLowerConfiguration.current || defaults);
      RTSHigherLowerConfiguration.request();
      return { apply };
    }
  };

  window.RTSHigherLowerSettings = Settings;
})();
