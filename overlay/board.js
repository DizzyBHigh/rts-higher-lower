(() => {
  const defaults = { round: 0, roundTotal: 0, potTotal: 0 };

  const money = value => {
    if (String(value || '').toUpperCase() === 'BANK') return 'BANK';
    const amount = Number(value);
    return Number.isFinite(amount) ? amount.toLocaleString('en-US') : '0';
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
          '<div>Round Total <strong class="hl-board__round-total"></strong></div>' +
          '<div>Pot Total <strong class="hl-board__pot-total"></strong></div>' +
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
    stage.querySelector('.hl-board__round').textContent =
      'ROUND ' + String(data.round);
    stage.querySelector('.hl-board__round-total').textContent =
      money(data.roundTotal);
    stage.querySelector('.hl-board__pot-total').textContent =
      money(data.potTotal);
    return stage;
  }

  window.RTSHigherLowerBoard = { build, update, applyLayout };
})();
