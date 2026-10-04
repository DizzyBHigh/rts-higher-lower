(() => {
  const extensionId = 'rts-higher-lower';

  const findSection = (root, title) => Array.from(
    root.querySelectorAll('.rts-ui-section')
  ).find(section => {
    const heading = section.querySelector(':scope > .rts-ui-title, :scope > .rts-ui-collapse-title');
    return heading?.textContent.trim() === title;
  });

  const setNumber = (input, value) => { input.value = Number(value) || 0; };

  const SettingsFix = {
    install() {
      const original = window.RTSHigherLowerSettings?.render;
      if (!original || original.__rtsFixed) return;

      const render = host => {
        const result = original(host);
        const board = findSection(host, 'Game Background');
        const players = findSection(host, 'Player List Panel');
        const round = findSection(host, 'Round Information');
        if (!board || !players || !round) return result;

        const ui = RTS.core.ui;
        const extension = RTS.getExtension(extensionId);

        const boardControls = {
          color1: ui.color({ value: '#d8c79e', onInput: preview }),
          color2: ui.color({ value: '#d8c79e', onInput: preview }),
          direction: ui.angle({ value: 90, onInput: preview }),
          borderWidth: ui.number({ value: 10, min: 0, max: 100, onInput: preview }),
          borderColor: ui.color({ value: '#6f5a3c', onInput: preview }),
          radius: ui.number({ value: 28, min: 0, max: 200, onInput: preview })
        };
        const playerControls = {
          color1: ui.color({ value: '#20252a', onInput: preview }),
          color2: ui.color({ value: '#20252a', onInput: preview }),
          direction: ui.angle({ value: 90, onInput: preview }),
          borderWidth: ui.number({ value: 4, min: 0, max: 100, onInput: preview }),
          borderColor: ui.color({ value: '#0384CB', onInput: preview }),
          radius: ui.number({ value: 12, min: 0, max: 200, onInput: preview }),
          titleColor: ui.color({ value: '#ffffff', onInput: preview }),
          titleShadow: ui.color({ value: '#000000', onInput: preview }),
          titleDirection: ui.angle({ value: 0, onInput: preview })
        };
        const roundControls = {
          color: ui.color({ value: '#30291f', onInput: preview }),
          shadow: ui.color({ value: '#000000', onInput: preview }),
          direction: ui.angle({ value: 0, onInput: preview })
        };

        board.append(
          ui.field('Colour 1', boardControls.color1),
          ui.field('Colour 2', boardControls.color2),
          ui.field('Gradient Direction', boardControls.direction),
          ui.field('Border Width', boardControls.borderWidth),
          ui.field('Border Colour', boardControls.borderColor),
          ui.field('Corner Radius', boardControls.radius)
        );
        players.append(
          ui.field('Colour 1', playerControls.color1),
          ui.field('Colour 2', playerControls.color2),
          ui.field('Gradient Direction', playerControls.direction),
          ui.field('Border Width', playerControls.borderWidth),
          ui.field('Border Colour', playerControls.borderColor),
          ui.field('Corner Radius', playerControls.radius),
          ui.field('Title Colour', playerControls.titleColor),
          ui.field('Title Shadow Colour', playerControls.titleShadow),
          ui.field('Title Shadow Direction', playerControls.titleDirection)
        );
        round.append(
          ui.field('Colour', roundControls.color),
          ui.field('Shadow Colour', roundControls.shadow),
          ui.field('Shadow Direction', roundControls.direction)
        );

        const readBrand = configuration => {
          const brands = configuration?.brands || {};
          const name = configuration?.activeBrand || Object.keys(brands)[0] || 'default';
          return brands[name] || {};
        };

        const applyControls = configuration => {
          const brand = readBrand(configuration);
          const boardValue = brand.board || {};
          const playersValue = brand.players || {};
          const title = playersValue.title || {};
          const roundValue = brand.round || {};
          boardControls.color1.value = boardValue.color1 || '#d8c79e';
          boardControls.color2.value = boardValue.color2 || '#d8c79e';
          boardControls.direction.setValue(boardValue.gradientDirection ?? 90);
          setNumber(boardControls.borderWidth, boardValue.borderWidth ?? 10);
          boardControls.borderColor.value = boardValue.borderColor || '#6f5a3c';
          setNumber(boardControls.radius, boardValue.cornerRadius ?? 28);
          playerControls.color1.value = playersValue.color1 || '#20252a';
          playerControls.color2.value = playersValue.color2 || '#20252a';
          playerControls.direction.setValue(playersValue.gradientDirection ?? 90);
          setNumber(playerControls.borderWidth, playersValue.borderWidth ?? 4);
          playerControls.borderColor.value = playersValue.borderColor || '#0384CB';
          setNumber(playerControls.radius, playersValue.cornerRadius ?? 12);
          playerControls.titleColor.value = title.color || '#ffffff';
          playerControls.titleShadow.value = title.shadowColor || '#000000';
          playerControls.titleDirection.setValue(title.shadowDirection ?? 0);
          roundControls.color.value = roundValue.color || '#30291f';
          roundControls.shadow.value = roundValue.shadowColor || '#000000';
          roundControls.direction.setValue(roundValue.shadowDirection ?? 0);
        };

        const patch = () => {
          const configuration = JSON.parse(JSON.stringify(RTSHigherLowerConfiguration.current || {}));
          const name = configuration.activeBrand || 'default';
          configuration.brands = configuration.brands || {};
          configuration.brands[name] = {
            ...(configuration.brands[name] || {}),
            board: {
              color1: boardControls.color1.value,
              color2: boardControls.color2.value,
              gradientDirection: boardControls.direction.getValue(),
              borderWidth: Number(boardControls.borderWidth.value) || 0,
              borderColor: boardControls.borderColor.value,
              cornerRadius: Number(boardControls.radius.value) || 0
            },
            players: {
              ...(configuration.brands[name]?.players || {}),
              color1: playerControls.color1.value,
              color2: playerControls.color2.value,
              gradientDirection: playerControls.direction.getValue(),
              borderWidth: Number(playerControls.borderWidth.value) || 0,
              borderColor: playerControls.borderColor.value,
              cornerRadius: Number(playerControls.radius.value) || 0,
              title: {
                color: playerControls.titleColor.value,
                shadowColor: playerControls.titleShadow.value,
                shadowDirection: playerControls.titleDirection.getValue()
              }
            },
            round: {
              color: roundControls.color.value,
              shadowColor: roundControls.shadow.value,
              shadowDirection: roundControls.direction.getValue()
            }
          };
          return configuration;
        };

        function preview() {
          if (!extension) return;
          const configuration = patch();
          const brand = readBrand(configuration);
          const panel = RTSHigherLowerPresentation.getPanel(extension);
          RTSHigherLowerBoard.applyAppearance(panel, brand);
          RTSHigherLowerPlayers.applyAppearance(
            RTSHigherLowerPlayersPresentation.getPanel(extension), brand
          );
        }

        const saveBrand = Array.from(host.querySelectorAll('button')).find(
          button => button.textContent.trim() === 'Save Brand'
        );
        saveBrand?.addEventListener('click', () => {
          const configuration = patch();
          RTSHigherLowerConfiguration.save(configuration);
        });

        RTSHigherLowerConfiguration.onReady(applyControls);
        RTSHigherLowerConfiguration.onChange(applyControls);
        return result;
      };

      render.__rtsFixed = true;
      window.RTSHigherLowerSettings.render = render;
    }
  };

  SettingsFix.install();
})();
