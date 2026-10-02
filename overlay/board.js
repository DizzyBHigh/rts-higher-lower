(() => {
  const defaults = { round: 0, roundTotal: 0, potTotal: 0 };

  const money = value => {
    if (String(value || '').toUpperCase() === 'BANK') return 'BANK';
    const amount = Number(value);
    return Number.isFinite(amount) ? amount.toLocaleString('en-US') : '0';
  };

  const shadowOffset = angle => {
    const radians = (Number(angle) || 0) * Math.PI / 180;
    return {
      x: (Math.cos(radians) * 3).toFixed(2) + 'px',
      y: (Math.sin(radians) * 3).toFixed(2) + 'px'
    };
  };

  function build(panel) {
    panel.setContent(
      '<div class="hl-stage">' +
        '<div class="hl-board"></div>' +
        '<div class="hl-board__round"></div>' +
        '<section class="hl-board__cards">' +
          '<div class="hl-board__card-slot hl-board__previous"></div>' +
          '<div class="hl-board__card-slot hl-board__lower"></div>' +
          '<div class="hl-board__card-slot hl-board__deck"></div>' +
          '<div class="hl-board__card-slot hl-board__higher"></div>' +
        '</section>' +
        '<div class="hl-board__totals">' +
          '<div class="hl-board__total-row hl-board__round-total-row">' +
            '<span class="hl-board__total-label hl-board__round-total-label">Round Total</span>' +
            '<strong class="hl-board__total-value hl-board__round-total-value"></strong>' +
          '</div>' +
          '<div class="hl-board__total-row hl-board__pot-total-row">' +
            '<span class="hl-board__total-label hl-board__pot-total-label">Pot Total</span>' +
            '<strong class="hl-board__total-value hl-board__pot-total-value"></strong>' +
          '</div>' +
        '</div>' +
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

  function applyTextStyle(stage, prefix, settings, fallback) {
    const value = settings || fallback;
    const shadow = shadowOffset(value.shadowDirection);
    stage.style.setProperty('--hl-' + prefix + '-size', (Number(value.fontSize) || fallback.fontSize) + 'px');
    stage.style.setProperty('--hl-' + prefix + '-color', value.color || fallback.color);
    stage.style.setProperty('--hl-' + prefix + '-shadow-color', value.shadowColor || fallback.shadowColor);
    stage.style.setProperty('--hl-' + prefix + '-shadow-x', shadow.x);
    stage.style.setProperty('--hl-' + prefix + '-shadow-y', shadow.y);
    stage.style.setProperty('--hl-' + prefix + '-align', value.textAlign || fallback.textAlign || 'right');
  }

  function applyAppearance(panel, appearance = {}) {
    const stage = panel.element.querySelector('.hl-stage') || build(panel);
    const board = appearance.board || {};
    const round = appearance.round || {};
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

    stage.style.setProperty('--hl-round-size', (Number(round.fontSize) || 34) + 'px');
    stage.style.setProperty('--hl-round-color', round.color || '#30291f');
    stage.style.setProperty('--hl-round-shadow-color', round.shadowColor || '#000000');
    const roundShadow = shadowOffset(round.shadowDirection);
    stage.style.setProperty('--hl-round-shadow-x', roundShadow.x);
    stage.style.setProperty('--hl-round-shadow-y', roundShadow.y);
    applyTextStyle(stage, 'round-total-label', roundTotalLabel, { fontSize: 24, color: '#30291f', shadowColor: '#000000', textAlign: 'right' });
    applyTextStyle(stage, 'round-total-value', roundTotalValue, { fontSize: 24, color: '#30291f', shadowColor: '#000000', textAlign: 'right' });
    applyTextStyle(stage, 'pot-total-label', potTotalLabel, { fontSize: 24, color: '#30291f', shadowColor: '#000000', textAlign: 'right' });
    applyTextStyle(stage, 'pot-total-value', potTotalValue, { fontSize: 24, color: '#30291f', shadowColor: '#000000', textAlign: 'right' });
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
      applySlot(stage.querySelector('.hl-board__' + name), layout.elements[name]);
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
