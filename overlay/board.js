(() => {
  const defaults = { round: 0, roundTotal: 0, potTotal: 0 };

  const textScale = {
    round: 34 / 48,
    roundTimer: 34 / 48,
    roundTotalLabel: 24 / 28,
    roundTotalValue: 24 / 28,
    potTotalLabel: 24 / 28,
    potTotalValue: 24 / 28
  };

  const selectors = {
    round: '.hl-board__round',
    roundTimer: '.hl-board__round-timer',
    roundTotalLabel: '.hl-board__round-total-label',
    roundTotalValue: '.hl-board__round-total-value',
    potTotalLabel: '.hl-board__pot-total-label',
    potTotalValue: '.hl-board__pot-total-value'
  };

  const money = value => {
    if (String(value || '').toUpperCase() === 'BANK') return 'BANK';
    const amount = Number(value);
    return Number.isFinite(amount) ? amount.toLocaleString('en-US') : '0';
  };

  const shadowOffset = value => {
    const source = value && typeof value === 'object' ? value : { angle: Number(value) || 0, distance: 3 };
    const angle = Number(source.angle) || 0;
    const distance = Math.max(0, Number(source.distance) || 0);
    const radians = angle * Math.PI / 180;
    return {
      x: (Math.sin(radians) * distance).toFixed(2) + 'px',
      y: (-Math.cos(radians) * distance).toFixed(2) + 'px'
    };
  };

  function build(panel) {
    panel.setContent(
      '<div class="hl-stage">' +
        '<div class="hl-board"></div>' +
        '<div class="hl-board__round"></div>' +
        '<div class="hl-board__round-timer">00:00</div>' +
        '<section class="hl-board__cards">' +
          '<div class="hl-board__card-slot hl-board__previous"></div>' +
          '<div class="hl-board__card-slot hl-board__lower"></div>' +
          '<div class="hl-board__card-slot hl-board__deck"></div>' +
          '<div class="hl-board__card-slot hl-board__higher"></div>' +
        '</section>' +
        '<span class="hl-board__total-label hl-board__round-total-label">Round Total</span>' +
        '<strong class="hl-board__total-value hl-board__round-total-value"></strong>' +
        '<span class="hl-board__total-label hl-board__pot-total-label">Pot Total</span>' +
        '<strong class="hl-board__total-value hl-board__pot-total-value"></strong>' +
      '</div>'
    );
    return panel.element.querySelector('.hl-stage');
  }

  function applySlot(target, value) {
    if (!target || !value) return;
    target.style.left = value.x + 'px';
    target.style.top = value.y + 'px';
    target.style.width = value.width + 'px';
    target.style.height = value.height + 'px';
    target.style.zIndex = String(value.z ?? 0);
  }

  function applyTextScale(stage, name) {
    const element = stage.querySelector(selectors[name]);
    if (!element) return;
    const height = Number.parseFloat(element.style.height) || 0;
    const ratio = textScale[name] || 0.75;
    const prefix = name.replace(/([A-Z])/g, '-$1').toLowerCase();
    stage.style.setProperty('--hl-' + prefix + '-size', height * ratio + 'px');
  }

  function applyTextStyle(stage, prefix, name, settings, fallback) {
    const value = settings || fallback;
    const shadow = shadowOffset(value.shadowDirection);
    stage.style.setProperty('--hl-' + prefix + '-color', value.color || fallback.color);
    stage.style.setProperty('--hl-' + prefix + '-shadow-color', value.shadowColor || fallback.shadowColor);
    stage.style.setProperty('--hl-' + prefix + '-shadow-x', shadow.x);
    stage.style.setProperty('--hl-' + prefix + '-shadow-y', shadow.y);
    stage.style.setProperty('--hl-' + prefix + '-align', value.textAlign || fallback.textAlign || 'right');
    applyTextScale(stage, name);
  }

  function applyAppearance(panel, appearance = {}) {
    const stage = panel.element.querySelector('.hl-stage') || build(panel);
    const board = appearance.board || {};
    const round = appearance.round || {};
    const roundTimer = appearance.roundTimer || {};
    const roundTotal = appearance.roundTotal || {};
    const potTotal = appearance.potTotal || {};
    const roundTotalLabel = roundTotal.label || roundTotal;
    const roundTotalValue = roundTotal.value || roundTotal;
    const potTotalLabel = potTotal.label || potTotal;
    const potTotalValue = potTotal.value || potTotal;
    const gradientAngle = ((Number(board.gradientDirection) || 0) + 90) % 360;
    const color1 = board.color1 || '#d8c79e';
    const color2 = board.color2 || '#d8c79e';
    const borderWidth = Number(board.borderWidth) || 0;
    const borderColor = board.borderColor || '#6f5a3c';
    const radius = Number(board.cornerRadius) || 0;
    const boardElement = stage.querySelector('.hl-board');

    stage.style.setProperty('--hl-font-family', appearance.fontFamily || 'Arial');
    stage.style.setProperty('--hl-board-color-1', color1);
    stage.style.setProperty('--hl-board-color-2', color2);
    stage.style.setProperty('--hl-board-gradient-direction', gradientAngle + 'deg');
    stage.style.setProperty('--hl-board-border-width', borderWidth + 'px');
    stage.style.setProperty('--hl-board-border-color', borderColor);
    stage.style.setProperty('--hl-board-radius', radius + 'px');

    if (boardElement) {
      boardElement.style.background = 'linear-gradient(' + gradientAngle + 'deg, ' + color1 + ', ' + color2 + ')';
      boardElement.style.borderWidth = borderWidth + 'px';
      boardElement.style.borderColor = borderColor;
      boardElement.style.borderRadius = radius + 'px';
    }

    applyTextStyle(stage, 'round', 'round', round, { color: '#30291f', shadowColor: '#000000', textAlign: 'center' });
    applyTextStyle(stage, 'round-timer', 'roundTimer', roundTimer, { color: '#30291f', shadowColor: '#000000', textAlign: 'center' });
    applyTextStyle(stage, 'round-total-label', 'roundTotalLabel', roundTotalLabel, { color: '#30291f', shadowColor: '#000000', textAlign: 'right' });
    applyTextStyle(stage, 'round-total-value', 'roundTotalValue', roundTotalValue, { color: '#30291f', shadowColor: '#000000', textAlign: 'right' });
    applyTextStyle(stage, 'pot-total-label', 'potTotalLabel', potTotalLabel, { color: '#30291f', shadowColor: '#000000', textAlign: 'right' });
    applyTextStyle(stage, 'pot-total-value', 'potTotalValue', potTotalValue, { color: '#30291f', shadowColor: '#000000', textAlign: 'right' });
  }

  function applyLayout(panel, layout) {
    const stage = panel.element.querySelector('.hl-stage') || build(panel);
    const board = layout.board;

    stage.style.width = '1920px';
    stage.style.height = '1080px';

    const boardElement = stage.querySelector('.hl-board');
    boardElement.style.left = (board.x || 0) + 'px';
    boardElement.style.top = (board.y || 0) + 'px';
    boardElement.style.width = board.width + 'px';
    boardElement.style.height = board.height + 'px';
    boardElement.style.zIndex = String(board.z ?? 0);
    boardElement.style.transform = 'scale(' + ((Number(board.scale) || 100) / 100) + ')';
    boardElement.style.transformOrigin = 'top left';

    Object.keys(layout.elements).forEach(name => {
      applySlot(stage.querySelector(selectors[name]), layout.elements[name]);
      applyTextScale(stage, name);
    });

    Object.keys(layout.cards).forEach(name => {
      applySlot(stage.querySelector('.hl-board__' + name), layout.cards[name]);
    });

    return stage;
  }

  function update(panel, state = {}) {
    const data = { ...defaults, ...state };
    const stage = panel.element.querySelector('.hl-stage') || build(panel);
    stage.querySelector('.hl-board__round').textContent = 'ROUND ' + String(data.round);
    stage.querySelector('.hl-board__round-total-value').textContent = money(data.roundTotal);
    stage.querySelector('.hl-board__pot-total-value').textContent = money(data.potTotal);
    return stage;
  }

  window.RTSHigherLowerBoard = { build, update, applyLayout, applyAppearance };
})();