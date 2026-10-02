(() => {
  const defaultText = {
    fontSize: 24,
    color: '#30291f',
    shadowColor: '#000000',
    shadowDirection: 0,
    textAlign: 'right'
  };

  const defaultBrand = {
    fontFamily: 'Arial',
    board: {
      color1: '#d8c79e', color2: '#d8c79e', gradientDirection: 90,
      borderWidth: 10, borderColor: '#6f5a3c', cornerRadius: 28
    },
    round: { fontSize: 34, color: '#30291f', shadowColor: '#000000', shadowDirection: 0 },
    roundTotal: { label: { ...defaultText }, value: { ...defaultText } },
    potTotal: { label: { ...defaultText }, value: { ...defaultText } }
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

  const number = (value, fallback, min = 0, max = 999) => {
    const next = Number(value);
    if (!Number.isFinite(next)) return fallback;
    return Math.min(max, Math.max(min, next));
  };

  const clone = value => JSON.parse(JSON.stringify(value));

  const normaliseText = (value, fallback = defaultText) => {
    const source = value || {};
    return {
      fontSize: number(source.fontSize, fallback.fontSize, 1, 200),
      color: source.color || fallback.color,
      shadowColor: source.shadowColor || fallback.shadowColor,
      shadowDirection: Number(source.shadowDirection) || 0,
      textAlign: ['left', 'center', 'right'].includes(source.textAlign) ? source.textAlign : fallback.textAlign
    };
  };

  const normaliseBrands = configuration => {
    const value = configuration || {};
    if (value.brands && Object.keys(value.brands).length) return value;
    const brand = value.appearance || clone(defaultBrand);
    value.brands = { default: clone(brand) };
    value.activeBrand = 'default';
    delete value.appearance;
    return value;
  };

  const getText = (brand, key) => {
    const current = brand?.[key];
    if (current?.label || current?.value) {
      return {
        label: normaliseText(current.label),
        value: normaliseText(current.value)
      };
    }
    return {
      label: normaliseText(current, { ...defaultText, textAlign: 'right' }),
      value: normaliseText(current, { ...defaultText, textAlign: 'right' })
    };
  };

  const setOptions = (select, options, value) => {
    select.replaceChildren(...options.map(name => RTS.core.ui.el('option', { value: name, text: name })));
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
          RTSHigherLowerConfiguration.createBrand(collectBrand(), name.trim());
        }
      });
      const saveBrand = RTS.core.ui.button('Save Brand', {
        variant: 'blue',
        onClick: () => {
          const configuration = normaliseBrands(clone(RTSHigherLowerConfiguration.current || defaults));
          const activeBrand = brand.value || 'default';
          configuration.activeBrand = activeBrand;
          configuration.brands[activeBrand] = collectBrand();
          delete configuration.appearance;
          RTSHigherLowerConfiguration.save(configuration);
        }
      });
      const deleteBrand = RTS.core.ui.button('Delete', {
        onClick: () => RTSHigherLowerConfiguration.deleteBrand(brand.value)
      });
      brand.addEventListener('change', () => RTSHigherLowerConfiguration.activateBrand(brand.value));
      brandSection.append(RTS.core.ui.field('Brand', brand), newBrand, saveBrand, deleteBrand);

      const game = RTS.core.ui.section('Game Settings');
      const rounds = RTS.core.ui.number({ value: 10, min: 1, step: 1 });
      const length = RTS.core.ui.dropdown({ options: ['1 Minute', '30 Seconds'], value: '1 Minute' });

      const overlay = RTS.core.ui.section('Overlay Settings');
      const duration = RTS.core.ui.number({ value: 500, min: 0, step: 50 });
      const easing = RTS.core.ui.dropdown({ options: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'], value: 'ease-in-out' });

      const fontSettings = RTS.core.ui.section('Font Settings');
      const font = RTS.core.ui.fontPicker({ value: 'Arial', variant: '400', onChange: () => previewBrand() });
      fontSettings.append(RTS.core.ui.field('Font Selector', font));

      const board = RTS.core.ui.section('Background Board');
      const boardColor1 = RTS.core.ui.color({ value: '#d8c79e', onInput: () => previewBrand() });
      const boardColor2 = RTS.core.ui.color({ value: '#d8c79e', onInput: () => previewBrand() });
      const gradientDirection = RTS.core.ui.angle({ value: 90, onInput: () => previewBrand() });
      const borderWidth = RTS.core.ui.number({ value: 10, min: 0, max: 100, step: 1, onInput: () => previewBrand() });
      const borderColor = RTS.core.ui.color({ value: '#6f5a3c', onInput: () => previewBrand() });
      const cornerRadius = RTS.core.ui.number({ value: 28, min: 0, max: 200, step: 1, onInput: () => previewBrand() });

      const round = RTS.core.ui.section('Round Information');
      const roundSize = RTS.core.ui.number({ value: 34, min: 1, max: 200, step: 1, onInput: () => previewBrand() });
      const roundColor = RTS.core.ui.color({ value: '#30291f', onInput: () => previewBrand() });
      const roundShadow = RTS.core.ui.color({ value: '#000000', onInput: () => previewBrand() });
      const roundShadowDirection = RTS.core.ui.angle({ value: 0, onInput: () => previewBrand() });

      const roundTotalLabel = RTS.core.ui.section('Round Total Label');
      const roundTotalLabelSize = RTS.core.ui.number({ value: 24, min: 1, max: 200, step: 1, onInput: () => previewBrand() });
      const roundTotalLabelColor = RTS.core.ui.color({ value: '#30291f', onInput: () => previewBrand() });
      const roundTotalLabelShadow = RTS.core.ui.color({ value: '#000000', onInput: () => previewBrand() });
      const roundTotalLabelDirection = RTS.core.ui.angle({ value: 0, onInput: () => previewBrand() });
      const roundTotalLabelAlign = RTS.core.ui.textAlignment({ value: 'right', onChange: () => previewBrand() });

      const roundTotalValue = RTS.core.ui.section('Round Total Value');
      const roundTotalValueSize = RTS.core.ui.number({ value: 24, min: 1, max: 200, step: 1, onInput: () => previewBrand() });
      const roundTotalValueColor = RTS.core.ui.color({ value: '#30291f', onInput: () => previewBrand() });
      const roundTotalValueShadow = RTS.core.ui.color({ value: '#000000', onInput: () => previewBrand() });
      const roundTotalValueDirection = RTS.core.ui.angle({ value: 0, onInput: () => previewBrand() });
      const roundTotalValueAlign = RTS.core.ui.textAlignment({ value: 'right', onChange: () => previewBrand() });

      const potTotalLabel = RTS.core.ui.section('Pot Total Label');
      const potTotalLabelSize = RTS.core.ui.number({ value: 24, min: 1, max: 200, step: 1, onInput: () => previewBrand() });
      const potTotalLabelColor = RTS.core.ui.color({ value: '#30291f', onInput: () => previewBrand() });
      const potTotalLabelShadow = RTS.core.ui.color({ value: '#000000', onInput: () => previewBrand() });
      const potTotalLabelDirection = RTS.core.ui.angle({ value: 0, onInput: () => previewBrand() });
      const potTotalLabelAlign = RTS.core.ui.textAlignment({ value: 'right', onChange: () => previewBrand() });

      const potTotalValue = RTS.core.ui.section('Pot Total Value');
      const potTotalValueSize = RTS.core.ui.number({ value: 24, min: 1, max: 200, step: 1, onInput: () => previewBrand() });
      const potTotalValueColor = RTS.core.ui.color({ value: '#30291f', onInput: () => previewBrand() });
      const potTotalValueShadow = RTS.core.ui.color({ value: '#000000', onInput: () => previewBrand() });
      const potTotalValueDirection = RTS.core.ui.angle({ value: 0, onInput: () => previewBrand() });
      const potTotalValueAlign = RTS.core.ui.textAlignment({ value: 'right', onChange: () => previewBrand() });

      const status = RTS.core.ui.el('small', { className: 'hl-settings-status' });
      const save = RTS.core.ui.button('Save Settings', {
        variant: 'blue',
        onClick: () => {
          const configuration = normaliseBrands(clone(RTSHigherLowerConfiguration.current || defaults));
          configuration.activeBrand = brand.value || 'default';
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

      const collectText = (size, color, shadow, direction, align) => ({
        fontSize: number(size.value, 24, 1, 200),
        color: color.value,
        shadowColor: shadow.value,
        shadowDirection: direction.getValue(),
        textAlign: align.getValue()
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
          label: collectText(roundTotalLabelSize, roundTotalLabelColor, roundTotalLabelShadow, roundTotalLabelDirection, roundTotalLabelAlign),
          value: collectText(roundTotalValueSize, roundTotalValueColor, roundTotalValueShadow, roundTotalValueDirection, roundTotalValueAlign)
        },
        potTotal: {
          label: collectText(potTotalLabelSize, potTotalLabelColor, potTotalLabelShadow, potTotalLabelDirection, potTotalLabelAlign),
          value: collectText(potTotalValueSize, potTotalValueColor, potTotalValueShadow, potTotalValueDirection, potTotalValueAlign)
        }
      });

      let previewFrame = 0;
      function previewBrand() {
        if (previewFrame) return;
        previewFrame = requestAnimationFrame(() => {
          previewFrame = 0;
          const extension = RTS.getExtension('rts-higher-lower');
          const panel = extension?.state?.panel;
          if (!panel) return;
          RTSHigherLowerBoard.applyAppearance(panel, collectBrand());
          status.textContent = 'Preview';
        });
      }

      game.append(RTS.core.ui.field('Default Rounds', rounds), RTS.core.ui.field('Round Length', length));
      overlay.append(RTS.core.ui.field('Card Duration', duration), RTS.core.ui.field('Card Easing', easing), save, status);
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
      roundTotalLabel.append(
        RTS.core.ui.field('Font Size', roundTotalLabelSize),
        RTS.core.ui.field('Colour', roundTotalLabelColor),
        RTS.core.ui.field('Shadow Colour', roundTotalLabelShadow),
        RTS.core.ui.field('Shadow Direction', roundTotalLabelDirection),
        RTS.core.ui.field('Text Alignment', roundTotalLabelAlign)
      );
      roundTotalValue.append(
        RTS.core.ui.field('Font Size', roundTotalValueSize),
        RTS.core.ui.field('Colour', roundTotalValueColor),
        RTS.core.ui.field('Shadow Colour', roundTotalValueShadow),
        RTS.core.ui.field('Shadow Direction', roundTotalValueDirection),
        RTS.core.ui.field('Text Alignment', roundTotalValueAlign)
      );
      potTotalLabel.append(
        RTS.core.ui.field('Font Size', potTotalLabelSize),
        RTS.core.ui.field('Colour', potTotalLabelColor),
        RTS.core.ui.field('Shadow Colour', potTotalLabelShadow),
        RTS.core.ui.field('Shadow Direction', potTotalLabelDirection),
        RTS.core.ui.field('Text Alignment', potTotalLabelAlign)
      );
      potTotalValue.append(
        RTS.core.ui.field('Font Size', potTotalValueSize),
        RTS.core.ui.field('Colour', potTotalValueColor),
        RTS.core.ui.field('Shadow Colour', potTotalValueShadow),
        RTS.core.ui.field('Shadow Direction', potTotalValueDirection),
        RTS.core.ui.field('Text Alignment', potTotalValueAlign)
      );
      host.append(game, overlay, brandSection, fontSettings, board, round, roundTotalLabel, roundTotalValue, potTotalLabel, potTotalValue);

      const apply = configuration => {
        const value = normaliseBrands(clone(configuration || defaults));
        const gameSettings = value.settings || defaults.settings;
        const animation = gameSettings.cardAnimation || defaults.settings.cardAnimation;
        const brands = value.brands || { default: defaultBrand };
        const activeBrand = value.activeBrand || Object.keys(brands)[0] || 'default';
        const appearance = brands[activeBrand] || defaultBrand;
        const boardSettings = appearance.board || defaultBrand.board;
        const roundSettings = appearance.round || defaultBrand.round;
        const roundTotalSettings = getText(appearance, 'roundTotal');
        const potTotalSettings = getText(appearance, 'potTotal');

        setOptions(brand, Object.keys(brands), activeBrand);
        rounds.value = Number(gameSettings.defaultRounds) || 10;
        length.value = Number(gameSettings.roundLength) === 30000 ? '30 Seconds' : '1 Minute';
        duration.value = Math.max(0, Number(animation.duration) || 500);
        easing.value = animation.easing || 'ease-in-out';
        font.setValue(appearance.fontFamily || 'Arial', '400');
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

        roundTotalLabelSize.value = roundTotalSettings.label.fontSize;
        roundTotalLabelColor.value = roundTotalSettings.label.color;
        roundTotalLabelShadow.value = roundTotalSettings.label.shadowColor;
        roundTotalLabelDirection.setValue(roundTotalSettings.label.shadowDirection);
        roundTotalLabelAlign.setValue(roundTotalSettings.label.textAlign);
        roundTotalValueSize.value = roundTotalSettings.value.fontSize;
        roundTotalValueColor.value = roundTotalSettings.value.color;
        roundTotalValueShadow.value = roundTotalSettings.value.shadowColor;
        roundTotalValueDirection.setValue(roundTotalSettings.value.shadowDirection);
        roundTotalValueAlign.setValue(roundTotalSettings.value.textAlign);

        potTotalLabelSize.value = potTotalSettings.label.fontSize;
        potTotalLabelColor.value = potTotalSettings.label.color;
        potTotalLabelShadow.value = potTotalSettings.label.shadowColor;
        potTotalLabelDirection.setValue(potTotalSettings.label.shadowDirection);
        potTotalLabelAlign.setValue(potTotalSettings.label.textAlign);
        potTotalValueSize.value = potTotalSettings.value.fontSize;
        potTotalValueColor.value = potTotalSettings.value.color;
        potTotalValueShadow.value = potTotalSettings.value.shadowColor;
        potTotalValueDirection.setValue(potTotalSettings.value.shadowDirection);
        potTotalValueAlign.setValue(potTotalSettings.value.textAlign);
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
