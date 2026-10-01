(() => {
  const ranks = [
    '2', '3', '4', '5', '6', '7', '8', '9', '10',
    'Jack', 'Queen', 'King', 'Ace'
  ];

  const suits = [
    { name: 'Hearts', symbol: '♥', code: 'H' },
    { name: 'Diamonds', symbol: '♦', code: 'D' },
    { name: 'Clubs', symbol: '♣', code: 'C' },
    { name: 'Spades', symbol: '♠', code: 'S' }
  ];

  function create() {
    const cards = [];

    suits.forEach(suit => ranks.forEach(rank => {
      const faceRanks = {
        Jack: 'J',
        Queen: 'Q',
        King: 'K',
        Ace: 'A'
      };
      const code = faceRanks[rank] || rank;

      cards.push({
        rank,
        suit: suit.name,
        symbol: suit.symbol,
        code: code + suit.code,
        value: ranks.indexOf(rank)
      });
    }));

    return cards;
  }

  function shuffle(cards) {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }

  RTS.core.higherLowerDeck = { create, shuffle };
})();
