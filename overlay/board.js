(() => {
  const defaults = { round: 0, roundTotal: 0, potTotal: 0 };

  const money = value => {
    if (String(value || '').toUpperCase() === 'BANK') return 'BANK';
    const amount = Number(value);
    return Number.isFinite(amount) ? amount.toLocaleString('en-US') : '0';
  };

  function build(panel) {
    panel.setContent(
      '<div class="hl-board">' +
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
    return panel.element.querySelector('.hl-board');
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
    const root = panel.element.querySelector('.hl-board') || build(panel);
    const board = layout.board;
    panel.element.style.width = board.width + 'px';
    panel.element.style.height = board.height + 'px';
    panel.element.style.zIndex = String(board.z ?? 0);
    root.style.width = board.width + 'px';
    root.style.height = board.height + 'px';

    Object.keys(layout.elements).forEach(name => {
      applySlot(root.querySelector('.hl-board__' + name), layout.elements[name]);
    });

    Object.keys(layout.cards).forEach(name => {
      applySlot(root.querySelector('.hl-board__' + name), layout.cards[name]);
    });

    return root;
  }

  function update(panel, state = {}) {
    const data = { ...defaults, ...state };
    const root = panel.element.querySelector('.hl-board') || build(panel);

    root.querySelector('.hl-board__round').textContent =
      'ROUND ' + String(data.round);
    root.querySelector('.hl-board__round-total').textContent =
      money(data.roundTotal);
    root.querySelector('.hl-board__pot-total').textContent =
      money(data.potTotal);

    return root;
  }

  window.RTSHigherLowerBoard = { build, update, applyLayout };
})();
