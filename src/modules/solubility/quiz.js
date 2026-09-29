// Quiz questions for the Solubility module — 5 MCQ per scenario
// Format matches the rates-of-reaction quiz schema:
//   { title, questions: [{ id, question, options, correctIndex }] }

export const solubilityQuizzes = {
  'nacl-water': {
    title: 'Solubility Quiz — Salt in Water',
    questions: [
      {
        id: 'nacl1',
        question: 'What type of bonding holds Na⁺ and Cl⁻ together in a salt crystal?',
        options: ['Covalent bonding', 'Hydrogen bonding', 'Ionic bonding', 'Van der Waals forces'],
        correctIndex: 2,
      },
      {
        id: 'nacl2',
        question: 'Why does water dissolve NaCl?',
        options: [
          'Water’s partial charges attract the ions',
          'Water chemically reacts with NaCl',
          'Water is nonpolar like NaCl',
          'The salt evaporates into the water',
        ],
        correctIndex: 0,
      },
      {
        id: 'nacl3',
        question: 'What happens to Na⁺ ions when NaCl dissolves in water?',
        options: [
          'They bond covalently to water',
          'They merge with Cl⁻ ions',
          'They float to the surface',
          'They become surrounded by water molecules (hydrated)',
        ],
        correctIndex: 3,
      },
      {
        id: 'nacl4',
        question: 'Which part of the water molecule is attracted to the Cl⁻ ion?',
        options: [
          'The δ⁻ oxygen end',
          'The δ⁺ hydrogen end',
          'Both ends equally',
          'Neither — water repels Cl⁻',
        ],
        correctIndex: 1,
      },
      {
        id: 'nacl5',
        question: 'What effect does stirring have on dissolving salt?',
        options: [
          'It increases the total amount of salt that can dissolve',
          'It has no effect at all',
          'It speeds up dissolution but doesn’t change total solubility',
          'It prevents the salt from dissolving',
        ],
        correctIndex: 2,
      },
    ],
  },

  'oil-water': {
    title: 'Solubility Quiz — Oil in Water',
    questions: [
      {
        id: 'oil1',
        question: 'Why don’t oil and water mix?',
        options: [
          'Oil is heavier than water',
          'Oil and water have the same polarity',
          'Water molecules are too large to mix with oil',
          'Oil is nonpolar and water is polar — their forces are incompatible',
        ],
        correctIndex: 3,
      },
      {
        id: 'oil2',
        question: 'Why does oil float on top of water?',
        options: [
          'Oil is repelled upward by water’s polarity',
          'Oil is less dense than water',
          'Oil contains air bubbles',
          'Oil is lighter because it’s nonpolar',
        ],
        correctIndex: 1,
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
          'Oil is afraid of water',
          'Nonpolar substances destroy water molecules',
          'Water molecules prefer bonding with each other over interacting with nonpolar substances',
          'Water becomes nonpolar near oil',
        ],
        correctIndex: 2,
      },
      {
        id: 'oil5',
        question: 'What substance could help oil and water mix (form an emulsion)?',
        options: [
          'More water',
          'Salt',
          'Sugar',
          'Soap / detergent (has both polar and nonpolar parts)',
        ],
        correctIndex: 3,
      },
    ],
  },
}
