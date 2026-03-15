// Quiz questions for each reaction in the Rates of Reaction module

export const quizzes = {
  general: {
    title: 'Rates of Reaction Quiz - General Model',
    questions: [
      {
        id: 'g1',
        question: 'What happens to the reaction rate when temperature increases?',
        options: [
          'It decreases because particles slow down',
          'It increases because particles move faster and collide more often',
          'It stays the same because temperature has no effect',
          'It increases only if a catalyst is present',
        ],
        correctIndex: 1,
      },
      {
        id: 'g2',
        question: 'What does a catalyst do in a chemical reaction?',
        options: [
          'It increases the temperature of the reaction',
          'It adds more reactant particles',
          'It lowers the activation energy so more collisions are successful',
          'It slows down the reaction to make it safer',
        ],
        correctIndex: 2,
      },
      {
        id: 'g3',
        question: 'How does increasing concentration affect the reaction rate?',
        options: [
          'More particles means more collisions per second, so the rate increases',
          'More particles means they move faster',
          'Concentration has no effect on reaction rate',
          'More particles means fewer successful collisions',
        ],
        correctIndex: 0,
      },
      {
        id: 'g4',
        question: 'In the simulation, what indicates a successful reaction?',
        options: [
          'Particles bounce off each other',
          'Particles pass through each other',
          'Two reactant particles combine to form a product particle',
          'Particles change speed',
        ],
        correctIndex: 2,
      },
      {
        id: 'g5',
        question: 'For a collision to result in a reaction, the particles must have:',
        options: [
          'The same colour',
          'Equal mass',
          'Enough energy (above the activation energy)',
          'Zero velocity',
        ],
        correctIndex: 2,
      },
    ],
  },

  aspirin: {
    title: 'Rates of Reaction Quiz - Aspirin Hydrolysis',
    questions: [
      {
        id: 'a1',
        question: 'Why do medicines like aspirin have expiry dates?',
        options: [
          'The packaging breaks down over time',
          'The active ingredient slowly breaks down through hydrolysis',
          'The colour changes and looks unappealing',
          'Government regulations require it regardless of chemistry',
        ],
        correctIndex: 1,
      },
      {
        id: 'a2',
        question: 'What conditions should medicines be stored in to minimise breakdown?',
        options: [
          'Hot and humid conditions',
          'Cool, dry conditions away from sunlight',
          'In the freezer',
          'Under high pressure',
        ],
        correctIndex: 1,
      },
      {
        id: 'a3',
        question: 'In aspirin hydrolysis, what are the products?',
        options: [
          'Water and carbon dioxide',
          'Salicylic acid and acetic acid',
          'Glucose and ethanol',
          'Nitrogen and hydrogen',
        ],
        correctIndex: 1,
      },
      {
        id: 'a4',
        question: 'How does pH affect the rate of aspirin hydrolysis?',
        options: [
          'Neutral pH speeds it up the most',
          'pH has no effect on hydrolysis',
          'Extreme pH (very acidic or very basic) accelerates hydrolysis',
          'Only basic pH affects the rate',
        ],
        correctIndex: 2,
      },
    ],
  },

  fermentation: {
    title: 'Rates of Reaction Quiz - Fermentation',
    questions: [
      {
        id: 'f1',
        question: 'What happens to the enzyme if the temperature is raised above 60\u00b0C?',
        options: [
          'It works faster than ever',
          'It denatures (unfolds) and stops working',
          'It breaks down glucose more efficiently',
          'Nothing \u2014 enzymes are not affected by temperature',
        ],
        correctIndex: 1,
      },
      {
        id: 'f2',
        question: 'What is the optimal temperature range for fermentation?',
        options: [
          '0-10\u00b0C',
          '35-40\u00b0C (around body temperature)',
          '80-100\u00b0C',
          '200-300\u00b0C',
        ],
        correctIndex: 1,
      },
      {
        id: 'f3',
        question: 'What are the products of glucose fermentation?',
        options: [
          'Water and salt',
          'Ethanol (alcohol) and carbon dioxide',
          'Ammonia and hydrogen',
          'Salicylic acid and water',
        ],
        correctIndex: 1,
      },
      {
        id: 'f4',
        question: 'Why is the enzyme NOT consumed during the reaction?',
        options: [
          'Because it is too large to react',
          'Because it acts as a catalyst \u2014 it speeds up the reaction without being used up',
          'Because it is made of metal',
          'It IS consumed, but slowly',
        ],
        correctIndex: 1,
      },
      {
        id: 'f5',
        question: 'Why does bread dough rise faster in a warm kitchen?',
        options: [
          'The flour absorbs more water when warm',
          'Yeast enzymes are more active at warm temperatures, producing more CO\u2082 gas',
          'Gravity is weaker in warm air',
          'The oven is already heating the dough',
        ],
        correctIndex: 1,
      },
    ],
  },

  haber: {
    title: 'Rates of Reaction Quiz - Haber Process',
    questions: [
      {
        id: 'h1',
        question: 'The Haber process is a reversible reaction. What does this mean?',
        options: [
          'The reaction can only go in one direction',
          'The reaction can proceed in both forward and reverse directions simultaneously',
          'The reaction stops after a few seconds',
          'Only a catalyst can start the reaction',
        ],
        correctIndex: 1,
      },
      {
        id: 'h2',
        question: 'Why does industry use ~450\u00b0C instead of a lower temperature?',
        options: [
          'Higher temperature gives a higher yield of ammonia',
          'Lower temperatures give a higher yield but the rate is too slow to be economical',
          'The catalyst only works at high temperatures',
          'Ammonia is more stable at high temperatures',
        ],
        correctIndex: 1,
      },
      {
        id: 'h3',
        question: 'What effect does the iron catalyst have on the equilibrium position?',
        options: [
          'It shifts equilibrium toward products',
          'It shifts equilibrium toward reactants',
          'It does not change the equilibrium position \u2014 it only speeds up both reactions equally',
          'It removes the reverse reaction completely',
        ],
        correctIndex: 2,
      },
      {
        id: 'h4',
        question: 'Why does high pressure favour ammonia production?',
        options: [
          'Because the forward reaction produces fewer gas moles (4 \u2192 2)',
          'Because pressure has no effect on gases',
          'Because high pressure heats the mixture',
          'Because the catalyst works better at high pressure',
        ],
        correctIndex: 0,
      },
      {
        id: 'h5',
        question: 'What trade-off does industry face with the Haber process?',
        options: [
          'Safety vs. cost',
          'High rate (high temp) vs. high yield (low temp)',
          'Using nitrogen vs. using oxygen',
          'There is no trade-off \u2014 all conditions are optimal',
        ],
        correctIndex: 1,
      },
    ],
  },
}
