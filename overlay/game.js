(() => {
  const Game = {
    create(options = {}) {
      const state = {
        deck: [],
        previousCard: null,
        currentCard: null,
        round: 0,
        rounds: Number(options.rounds) || 10,
        started: false
      };

      const reset = () => {
        state.deck = [];
        state.previousCard = null;
        state.currentCard = null;
        state.round = 0;
        state.started = false;
      };

      const start = rounds => {
        reset();
        state.rounds = Math.max(1, Number(rounds) || 10);
        state.deck = RTS.core.higherLowerDeck.shuffle(
          RTS.core.higherLowerDeck.create()
        );
        state.started = true;
        return snapshot();
      };

      const draw = () => {
        if (!state.started)
          throw new Error('Higher Lower game has not started.');
        if (state.round >= state.rounds)
          return { type: 'game-complete', state: snapshot() };

        const previous = state.currentCard;
        const card = state.deck.shift();
        state.round++;
        state.previousCard = previous;
        state.currentCard = card;

        if (!previous)
          return { type: 'first-card', round: state.round, card, state: snapshot() };

        const difference = card.value - previous.value;
        const result = difference > 0
          ? 'higher'
          : difference < 0
            ? 'lower'
            : 'equal';

        return {
          type: 'round-result',
          round: state.round,
          previous,
          card,
          result,
          state: snapshot()
        };
      };

      const snapshot = () => ({
        round: state.round,
        rounds: state.rounds,
        started: state.started,
        previousCard: state.previousCard,
        currentCard: state.currentCard,
        cardsRemaining: state.deck.length
      });

      return { start, draw, reset, state: snapshot };
    }
  };

  RTS.core.higherLowerGame = Game;
})();
