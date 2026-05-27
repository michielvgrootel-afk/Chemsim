// Quiz questions for the Solubility module — 5 MCQ per scenario
// Format matches the rates-of-reaction quiz schema:
//   { title, questions: [{ id, question, options, correctIndex }] }

export const solubilityQuizzes = {
  'nacl-water': {
    title: 'Solubility Quiz \u2014 Salt in Water',
    questions: [
      {
        id: 'nacl1',
        question: 'What type of bonding holds Na\u207a and Cl\u207b together in a salt crystal?',
        options: ['Ionic bonding', 'Covalent bonding', 'Hydrogen bonding', 'Van der Waals forces'],
        correctIndex: 0,
      },
      {
        id: 'nacl2',
        question: 'Why does water dissolve NaCl?',
        options: [
          'Water\u2019s partial charges attract the ions',
          'Water chemically reacts with NaCl',
          'Water is nonpolar like NaCl',
          'The salt evaporates into the water',
        ],
        correctIndex: 0,
      },
      {
        id: 'nacl3',
        question: 'What happens to Na\u207a ions when NaCl dissolves in water?',
        options: [
          'They become surrounded by water molecules (hydrated)',
          'They bond covalently to water',
          'They merge with Cl\u207b ions',
          'They float to the surface',
        ],
        correctIndex: 0,
      },
      {
        id: 'nacl4',
        question: 'Which part of the water molecule is attracted to the Cl\u207b ion?',
        options: [
          'The \u03b4\u207a hydrogen end',
          'The \u03b4\u207b oxygen end',
          'Both ends equally',
          'Neither \u2014 water repels Cl\u207b',
        ],
        correctIndex: 0,
      },
      {
        id: 'nacl5',
        question: 'What effect does stirring have on dissolving salt?',
        options: [
          'It speeds up dissolution but doesn\u2019t change total solubility',
          'It increases the total amount of salt that can dissolve',
          'It has no effect at all',
          'It prevents the salt from dissolving',
        ],
        correctIndex: 0,
      },
    ],
  },

  'oil-water': {
    title: 'Solubility Quiz \u2014 Oil in Water',
    questions: [
      {
        id: 'oil1',
        question: 'Why don\u2019t oil and water mix?',
        options: [
          'Oil is nonpolar and water is polar \u2014 their forces are incompatible',
          'Oil is heavier than water',
          'Oil and water have the same polarity',
          'Water molecules are too large to mix with oil',
        ],
        correctIndex: 0,
      },
      {
        id: 'oil2',
        question: 'Why does oil float on top of water?',
        options: [
          'Oil is less dense than water',
          'Oil is repelled upward by water\u2019s polarity',
          'Oil contains air bubbles',
          'Oil is lighter because it\u2019s nonpolar',
        ],
        correctIndex: 0,
      },
      {
        id: 'oil3',
        question: 'What happens when you vigorously shake oil and water together?',
        options: [
          'They temporarily mix but separate again when you stop',
          'They permanently dissolve into each other',
          'The oil evaporates',
          'The water changes color',
        ],
        correctIndex: 0,
      },
      {
        id: 'oil4',
        question: 'What is the "hydrophobic effect"?',
        options: [
          'Water molecules prefer bonding with each other over interacting with nonpolar substances',
          'Oil is afraid of water',
          'Nonpolar substances destroy water molecules',
          'Water becomes nonpolar near oil',
        ],
        correctIndex: 0,
      },
      {
        id: 'oil5',
        question: 'What substance could help oil and water mix (form an emulsion)?',
        options: [
          'Soap / detergent (has both polar and nonpolar parts)',
          'More water',
          'Salt',
          'Sugar',
        ],
        correctIndex: 0,
      },
    ],
  },
}
