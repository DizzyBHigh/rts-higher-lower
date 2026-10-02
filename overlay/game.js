(() => {
  const Game = {
    create(options = {}) {
      const state = {
        deck: [],
        previousCard: null,
        currentCard: null,
        round: 0,
        rounds: Number(options.rounds) || 10,
        players: [],
        roundHistory: [],
        bonusPot: 0,
        started: false
      };

      const reset = () => {
        state.deck = [];
        state.previousCard = null;
        state.currentCard = null;
        state.round = 0;
        state.players = [];
        state.roundHistory = [];
        state.bonusPot = 0;
        state.started = false;
      };

      const start = (rounds, players = [], bonusPot = 0) => {
        reset();
        state.rounds = Math.max(1, Number(rounds) || 10);
        state.bonusPot = Math.max(0, Number(bonusPot) || 0);
        state.players = Array.isArray(players)
          ? players.map(player => ({ ...player, vote: null, bet: 0 }))
          : [];
        state.deck = RTS.core.higherLowerDeck.shuffle(
          RTS.core.higherLowerDeck.create()
        );
        state.started = true;
        return snapshot();
      };

      const restore = saved => {
        reset();

        if (!saved || typeof saved !== 'object' || !saved.active)
          return snapshot();

        state.deck = Array.isArray(saved.deck) ? saved.deck.slice() : [];
        state.currentCard = saved.currentCard || null;
        state.round = Number(saved.round) || 0;
        state.rounds = Math.max(1, Number(saved.rounds) || 10);
        state.bonusPot = Math.max(0, Number(saved.bonusPot) || 0);
        state.players = Array.isArray(saved.players)
          ? saved.players.slice()
          : [];
        state.roundHistory = Array.isArray(saved.roundHistory)
          ? saved.roundHistory.slice()
          : [];
        state.previousCard = state.roundHistory.length > 1
          ? state.roundHistory[state.roundHistory.length - 2].card || null
          : null;
        state.started = true;
        return snapshot();
      };

      const draw = () => {
        if (!state.started)
          throw new Error('Higher Lower game has not started.');
        if (state.round >= state.rounds && state.currentCard)
          return { type: 'game-complete', state: snapshot() };

        const previous = state.currentCard;
        const card = state.deck.shift();

        if (!previous) {
          state.currentCard = card;
          state.roundHistory.push({
            round: 0,
            card,
            result: 'start'
          });

          return {
            type: 'first-card',
            round: 0,
            card,
            state: snapshot()
          };
        }

        state.round++;
        state.previousCard = previous;
        state.currentCard = card;

        const difference = card.value - previous.value;
        const result = difference > 0
          ? 'higher'
          : difference < 0
            ? 'lower'
            : 'equal';

        state.roundHistory.push({
          round: state.round,
          card,
          result
        });

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
        active: state.started,
        round: state.round,
        rounds: state.rounds,
        deck: state.deck.slice(),
        currentCard: state.currentCard,
        players: state.players.slice(),
        bonusPot: state.bonusPot,
        roundHistory: state.roundHistory.slice()
      });

      return { start, restore, draw, reset, state: snapshot };
    }
  };

  RTS.core.higherLowerGame = Game;
})();
