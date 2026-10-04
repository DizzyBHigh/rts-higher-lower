(() => {
  const defaultText = { color: '#30291f', shadowColor: '#000000', shadowDirection: { angle: 0, distance: 3 }, textAlign: 'right' };
  const defaultBrand = {
    fontFamily: 'Arial',
    board: { color1: '#d8c79e', color2: '#d8c79e', gradientDirection: 90, borderWidth: 10, borderColor: '#6f5a3c', cornerRadius: 28 },
    players: { color1: '#20252a', color2: '#20252a', gradientDirection: 90, borderWidth: 4, borderColor: '#0384CB', cornerRadius: 12, title: { color: '#ffffff', shadowColor: '#000000', shadowDirection: { angle: 0, distance: 3 } } },
    round: { color: '#30291f', shadowColor: '#000000', shadowDirection: { angle: 0, distance: 3 } },
    roundTimer: { color: '#30291f', shadowColor: '#000000', shadowDirection: { angle: 0, distance: 3 }, textAlign: 'center' },
    roundTotal: { label: { ...defaultText }, value: { ...defaultText } },
    potTotal: { label: { ...defaultText }, value: { ...defaultText } }
  };
  const defaults = { settings: { defaultRounds: 10, roundLength: 60000, cardAnimation: { duration: 500, easing: 'ease-in-out' } }, brands: { default: defaultBrand }, activeBrand: 'default' };
  const clone = value => JSON.parse(JSON.stringify(value));
  const number = (value, fallback, min = 0, max = 999) => { const next = Number(value); return Number.isFinite(next) ? Math.min(max, Math.max(min, next)) : fallback; };
  const shadow = value => value && typeof value === 'object' ? { angle: Number(value.angle) || 0, distance: Math.min(19, Math.max(0, Number(value.distance) || 0)) } : { angle: Number(value) || 0, distance: 3 };
  const normaliseText = (value, fallback = defaultText) => ({ color: value?.color || fallback.color, shadowColor: value?.shadowColor || fallback.shadowColor, shadowDirection: shadow(value?.shadowDirection), textAlign: ['left', 'center', 'right'].includes(value?.textAlign) ? value.textAlign : fallback.textAlign });
  const normaliseBrands = configuration => { const value = configuration || {}; if (value.brands && Object.keys(value.brands).length) return value; value.brands = { default: clone(value.appearance || defaultBrand) }; value.activeBrand = 'default'; delete value.appearance; return value; };
  const getText = (brand, key) => { const value = brand?.[key]; if (value?.label || value?.value) return { label: normaliseText(value.label), value: normaliseText(value.value) }; const text = normaliseText(value); return { label: text, value: text }; };
  const setOptions = (select, options, value) => { select.replaceChildren(...options.map(name => RTS.core.ui.el('option', { value: name, text: name }))); select.value = value || options[0] || ''; };
  const Settings = {
    render(host) {
      if (!host || !RTS.core.ui) return null;
      const game = RTS.core.ui.section('Game Settings');
      const rounds = RTS.core.ui.number({ value: 10, min: 1, step: 1 });
      const length = RTS.core.ui.dropdown({ options: ['1 Minute', '30 Seconds'], value: '1 Minute' });
      const duration = RTS.core.ui.number({ value: 500, min: 0, step: 50 });
      const easing = RTS.core.ui.dropdown({ options: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'], value: 'ease-in-out' });
      const brandSection = RTS.core.ui.section('Brand Presets');
      const brand = RTS.core.ui.dropdown({ options: ['default'], value: 'default' });
      const elementStyles = RTS.core.ui.section('Element Styles');
      const fontSection = RTS.core.ui.section('Font');
      const font = RTS.core.ui.fontPicker({ value: 'Arial', variant: '400', onChange: () => previewBrand() });
      const board = RTS.core.ui.section('Game Background');
      const boardColor1 = RTS.core.ui.color({ value: '#d8c79e', onInput: () => previewBrand() });
      const boardColor2 = RTS.core.ui.color({ value: '#d8c79e', onInput: () => previewBrand() });
      const gradientDirection = RTS.core.ui.angle({ value: 90, onInput: () => previewBrand() });
      const borderWidth = RTS.core.ui.number({ value: 10, min: 0, max: 100, step: 1, onInput: () => previewBrand() });
      const borderColor = RTS.core.ui.color({ value: '#6f5a3c', onInput: () => previewBrand() });
      const cornerRadius = RTS.core.ui.number({ value: 28, min: 0, max: 200, step: 1, onInput: () => previewBrand() });
      board.append(RTS.core.ui.field('Colour 1', boardColor1), RTS.core.ui.field('Colour 2', boardColor2), RTS.core.ui.field('Gradient Direction', gradientDirection), RTS.core.ui.field('Border Width', borderWidth), RTS.core.ui.field('Border Colour', borderColor), RTS.core.ui.field('Corner Radius', cornerRadius));
      const players = RTS.core.ui.section('Player List Panel');
      const playersColor1 = RTS.core.ui.color({ value: '#20252a', onInput: () => previewBrand() });
      const playersColor2 = RTS.core.ui.color({ value: '#20252a', onInput: () => previewBrand() });
      const playersGradientDirection = RTS.core.ui.angle({ value: 90, onInput: () => previewBrand() });
      const playersBorderWidth = RTS.core.ui.number({ value: 4, min: 0, max: 100, step: 1, onInput: () => previewBrand() });
      const playersBorderColor = RTS.core.ui.color({ value: '#0384CB', onInput: () => previewBrand() });
      const playersCornerRadius = RTS.core.ui.number({ value: 12, min: 0, max: 200, step: 1, onInput: () => previewBrand() });
      const playersTitleColor = RTS.core.ui.color({ value: '#ffffff', onInput: () => previewBrand() });
      const playersTitleShadow = RTS.core.ui.color({ value: '#000000', onInput: () => previewBrand() });
      const playersTitleShadowDirection = RTS.core.ui.angle({ value: defaultBrand.players.title.shadowDirection, onInput: () => previewBrand() });
      players.append(RTS.core.ui.field('Colour 1', playersColor1), RTS.core.ui.field('Colour 2', playersColor2), RTS.core.ui.field('Gradient Direction', playersGradientDirection), RTS.core.ui.field('Border Width', playersBorderWidth), RTS.core.ui.field('Border Colour', playersBorderColor), RTS.core.ui.field('Corner Radius', playersCornerRadius), RTS.core.ui.field('Title Colour', playersTitleColor), RTS.core.ui.field('Title Shadow Colour', playersTitleShadow), RTS.core.ui.field('Title Shadow Direction', playersTitleShadowDirection));
      const round = RTS.core.ui.section('Round Information');
      const roundColor = RTS.core.ui.color({ value: '#30291f', onInput: () => previewBrand() });
      const roundShadow = RTS.core.ui.color({ value: '#000000', onInput: () => previewBrand() });
      const roundShadowDirection = RTS.core.ui.angle({ value: defaultBrand.round.shadowDirection, onInput: () => previewBrand() });
      round.append(RTS.core.ui.field('Colour', roundColor), RTS.core.ui.field('Shadow Colour', roundShadow), RTS.core.ui.field('Shadow Direction', roundShadowDirection));
      const textControls = (title, value) => { const section = RTS.core.ui.section(title); const color = RTS.core.ui.color({ value: value.color, onInput: () => previewBrand() }); const shadowColor = RTS.core.ui.color({ value: value.shadowColor, onInput: () => previewBrand() }); const direction = RTS.core.ui.angle({ value: value.shadowDirection, onInput: () => previewBrand() }); const align = RTS.core.ui.textAlignment({ value: value.textAlign, onChange: () => previewBrand() }); section.append(RTS.core.ui.field('Colour', color), RTS.core.ui.field('Shadow Colour', shadowColor), RTS.core.ui.field('Shadow Direction', direction), RTS.core.ui.field('Text Alignment', align)); return { section, color, shadow: shadowColor, direction, align }; };
      const roundTimer = textControls('Round Timer', defaultBrand.roundTimer);
      const roundTotalLabel = textControls('Round Total Label', defaultText);
      const roundTotalValue = textControls('Round Total Value', defaultText);
      const potTotalLabel = textControls('Pot Total Label', defaultText);
      const potTotalValue = textControls('Pot Total Value', defaultText);
      const status = RTS.core.ui.el('small', { className: 'hl-settings-status' });
      const collectText = value => ({ color: value.color.value, shadowColor: value.shadow.value, shadowDirection: value.direction.getValue(), textAlign: value.align.getValue() });
      const collectBrand = () => ({ fontFamily: font.value || 'Arial', board: { color1: boardColor1.value, color2: boardColor2.value, gradientDirection: gradientDirection.getValue(), borderWidth: number(borderWidth.value, 10, 0, 100), borderColor: borderColor.value, cornerRadius: number(cornerRadius.value, 28, 0, 200) }, players: { color1: playersColor1.value, color2: playersColor2.value, gradientDirection: playersGradientDirection.getValue(), borderWidth: number(playersBorderWidth.value, 4, 0, 100), borderColor: playersBorderColor.value, cornerRadius: number(playersCornerRadius.value, 12, 0, 200), title: { color: playersTitleColor.value, shadowColor: playersTitleShadow.value, shadowDirection: playersTitleShadowDirection.getValue() } }, round: { color: roundColor.value, shadowColor: roundShadow.value, shadowDirection: roundShadowDirection.getValue() }, roundTimer: collectText(roundTimer), roundTotal: { label: collectText(roundTotalLabel), value: collectText(roundTotalValue) }, potTotal: { label: collectText(potTotalLabel), value: collectText(potTotalValue) } });
      let previewFrame = 0;
      function previewBrand() { if (previewFrame) return; previewFrame = requestAnimationFrame(() => { previewFrame = 0; const extension = RTS.getExtension('rts-higher-lower'); const panel = extension?.state?.panel; if (!panel) return; const appearance = collectBrand(); RTSHigherLowerBoard.applyAppearance(panel, appearance); RTSHigherLowerPlayers.applyAppearance(RTSHigherLowerPlayersPresentation.getPanel(extension), appearance); status.textContent = 'Preview'; }); }
      const newBrand = RTS.core.ui.button('New Brand', { variant: 'blue', onClick: () => { const name = window.prompt('Brand name'); if (name?.trim()) RTSHigherLowerConfiguration.createBrand(collectBrand(), name.trim()); } });
      const saveBrand = RTS.core.ui.button('Save Brand', { variant: 'blue', onClick: () => { const configuration = normaliseBrands(clone(RTSHigherLowerConfiguration.current || defaults)); const activeBrand = brand.value || 'default'; configuration.activeBrand = activeBrand; configuration.brands[activeBrand] = collectBrand(); RTSHigherLowerConfiguration.save(configuration); } });
      const deleteBrand = RTS.core.ui.button('Delete', { onClick: () => RTSHigherLowerConfiguration.deleteBrand(brand.value) });
      brand.addEventListener('change', () => RTSHigherLowerConfiguration.activateBrand(brand.value));
      const save = RTS.core.ui.button('Save Settings', { variant: 'blue', onClick: () => { const configuration = normaliseBrands(clone(RTSHigherLowerConfiguration.current || defaults)); configuration.activeBrand = brand.value || 'default'; configuration.settings = { defaultRounds: Math.max(1, Number(rounds.value) || 10), roundLength: length.value === '30 Seconds' ? 30000 : 60000, cardAnimation: { duration: Math.max(0, Number(duration.value) || 500), easing: easing.value || 'ease-in-out' } }; status.textContent = 'Saving...'; RTSHigherLowerConfiguration.save(configuration); } });
      game.append(RTS.core.ui.field('Default Rounds', rounds), RTS.core.ui.field('Round Length', length), RTS.core.ui.field('Card Duration', duration), RTS.core.ui.field('Card Easing', easing), save, status);
      fontSection.append(RTS.core.ui.field('Font', font));
      elementStyles.append(fontSection, board, players, round, roundTimer.section, roundTotalLabel.section, roundTotalValue.section, potTotalLabel.section, potTotalValue.section);
      brandSection.append(RTS.core.ui.field('Brand', brand), newBrand, saveBrand, deleteBrand, elementStyles);
      host.append(game, brandSection);
      const apply = configuration => {
        const value = normaliseBrands(clone(configuration || defaults)); const settings = value.settings || defaults.settings; const animation = settings.cardAnimation || defaults.settings.cardAnimation; const brands = value.brands || { default: defaultBrand }; const active = value.activeBrand || Object.keys(brands)[0] || 'default'; const appearance = brands[active] || defaultBrand; const boardValue = appearance.board || defaultBrand.board; const playersValue = appearance.players || defaultBrand.players; const title = playersValue.title || defaultBrand.players.title; const roundValue = appearance.round || defaultBrand.round; const timerValue = appearance.roundTimer || defaultBrand.roundTimer; const roundTotal = getText(appearance, 'roundTotal'); const potTotal = getText(appearance, 'potTotal');
        setOptions(brand, Object.keys(brands), active); rounds.value = Number(settings.defaultRounds) || 10; length.value = Number(settings.roundLength) === 30000 ? '30 Seconds' : '1 Minute'; duration.value = Math.max(0, Number(animation.duration) || 500); easing.value = animation.easing || 'ease-in-out'; font.setValue(appearance.fontFamily || 'Arial', '400');
        boardColor1.value = boardValue.color1 || '#d8c79e'; boardColor2.value = boardValue.color2 || '#d8c79e'; gradientDirection.setValue(boardValue.gradientDirection ?? 90); borderWidth.value = number(boardValue.borderWidth, 10, 0, 100); borderColor.value = boardValue.borderColor || '#6f5a3c'; cornerRadius.value = number(boardValue.cornerRadius, 28, 0, 200);
        playersColor1.value = playersValue.color1 || '#20252a'; playersColor2.value = playersValue.color2 || '#20252a'; playersGradientDirection.setValue(playersValue.gradientDirection ?? 90); playersBorderWidth.value = number(playersValue.borderWidth, 4, 0, 100); playersBorderColor.value = playersValue.borderColor || '#0384CB'; playersCornerRadius.value = number(playersValue.cornerRadius, 12, 0, 200); playersTitleColor.value = title.color || '#ffffff'; playersTitleShadow.value = title.shadowColor || '#000000'; playersTitleShadowDirection.setValue(title.shadowDirection ?? { angle: 0, distance: 3 });
        roundColor.value = roundValue.color || '#30291f'; roundShadow.value = roundValue.shadowColor || '#000000'; roundShadowDirection.setValue(roundValue.shadowDirection ?? 0);
        const setText = (target, current) => { target.color.value = current.color; target.shadow.value = current.shadowColor; target.direction.setValue(current.shadowDirection); target.align.setValue(current.textAlign); }; setText(roundTimer, timerValue); setText(roundTotalLabel, roundTotal.label); setText(roundTotalValue, roundTotal.value); setText(potTotalLabel, potTotal.label); setText(potTotalValue, potTotal.value);
      };
      RTSHigherLowerConfiguration.onChange(configuration => { apply(configuration); status.textContent = 'Saved.'; });
      RTSHigherLowerConfiguration.onReady(apply);
      return { apply, elementStyles, brandSection };
    }
  };
  window.RTSHigherLowerSettings = Settings;
})();