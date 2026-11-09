// Quizzes for the Acids, Bases & Buffers module
// Schema matches rates-of-reaction/quiz.js:
//   { title, questions: [{ id, question, options, correctIndex }] }

export const acidsBasesQuizzes = {
  'strong-vs-weak': {
    title: 'Acids & Bases Quiz — Strong vs Weak',
    questions: [
      {
        id: 'sw1',
        question: 'What is the defining difference between a strong acid and a weak acid?',
        options: [
          'A strong acid is more concentrated than a weak acid',
          'A strong acid fully ionises in water; a weak acid only partially ionises',
          'A strong acid contains more hydrogen atoms than a weak acid',
          'A strong acid has a higher boiling point',
        ],
        correctIndex: 1,
      },
      {
        id: 'sw2',
        question: 'If you dissolve 100 HCl molecules in water, roughly how many H⁺ ions will be present at equilibrium?',
        options: ['Zero', 'About 5', 'About 50', 'About 100 (full dissociation)'],
        correctIndex: 3,
      },
      {
        id: 'sw3',
        question: 'If you dissolve 100 CH₃COOH molecules in water, roughly how many H⁺ ions will be present at equilibrium?',
        options: ['About 100', 'About 50', 'About 1-5 (only a few percent dissociate)', 'Zero'],
        correctIndex: 2,
      },
      {
        id: 'sw4',
        question: 'Why does CH₃COOH stay mostly intact in water, even though HCl falls apart immediately?',
        options: [
          'CH₃COOH is heavier than HCl',
          'CH₃COOH doesn’t contain hydrogen',
          'Water rejects CH₃COOH',
          'The H–O bond in CH₃COOH is stronger than the H–Cl bond in HCl, so it resists breaking',
        ],
        correctIndex: 3,
      },
      {
        id: 'sw5',
        question: 'Which has a LOWER pH: a solution of 0.1 mol/L HCl or 0.1 mol/L CH₃COOH?',
        options: [
          'HCl, because it produces far more H⁺ per molecule',
          'CH₃COOH, because it has more atoms',
          'They have the same pH because they have the same concentration',
          'Neither — both are neutral',
        ],
        correctIndex: 0,
      },
    ],
  },

  'neutralization': {
    title: 'Acids & Bases Quiz — Neutralisation',
    questions: [
      {
        id: 'n1',
        question: 'What is the product of the reaction H⁺ + OH⁻ → ?',
        options: ['H₂', 'O₂', 'H₂O (water)', 'HCl'],
        correctIndex: 2,
      },
      {
        id: 'n2',
        question: 'What role does Na⁺ play in the neutralisation of HCl with NaOH?',
        options: [
          'It reacts with Cl⁻ to form a precipitate',
          'It catalyses the reaction',
          'It changes colour',
          'It is a spectator ion — it doesn’t react, it just stays dissolved',
        ],
        correctIndex: 3,
      },
      {
        id: 'n3',
        question: 'In the simulation, why does the indicator change colour as you add NaOH drops?',
        options: [
          'The NaOH chemically bonds to the indicator',
          'The H⁺/OH⁻ ratio in the solution changes, and the indicator responds to that ratio',
          'The temperature rises',
          'The indicator dissolves',
        ],
        correctIndex: 1,
      },
      {
        id: 'n4',
        question: 'What is the "equivalence point" in a titration?',
        options: [
          'The point where the amount of added base exactly matches the amount of acid',
          'The point where the solution starts boiling',
          'The point where the indicator first appears',
          'The point where the acid is fully diluted',
        ],
        correctIndex: 0,
      },
      {
        id: 'n5',
        question: 'You add far too much NaOH and the pH shoots past 7. What can you do to bring it back?',
        options: [
          'Heat the solution',
          'Add more water — that will neutralise it',
          'Add more HCl — its H⁺ ions will react with the excess OH⁻',
          'Wait — the pH will return on its own',
        ],
        correctIndex: 2,
      },
    ],
  },

  'buffer': {
    title: 'Acids & Bases Quiz — Buffers',
    questions: [
      {
        id: 'b1',
        question: 'What two species make up an acetate buffer?',
        options: [
          'A weak acid (CH₃COOH) and its conjugate base (CH₃COO⁻)',
          'A strong acid and a strong base',
          'Water and salt',
          'Two different strong acids',
        ],
        correctIndex: 0,
      },
      {
        id: 'b2',
        question: 'When you add HCl to a buffer, why does the pH barely change?',
        options: [
          'HCl doesn’t dissociate in a buffer',
          'The buffer evaporates the added acid',
          'The buffer heats up and neutralises the acid',
          'The added H⁺ ions react with the conjugate base (CH₃COO⁻) → CH₃COOH, so the free H⁺ concentration stays nearly constant',
        ],
        correctIndex: 3,
      },
      {
        id: 'b3',
        question: 'When you add NaOH to a buffer, what reaction absorbs it?',
        options: [
          'OH⁻ + Na⁺ → NaOH again',
          'OH⁻ + CH₃COOH → CH₃COO⁻ + H₂O',
          'OH⁻ → O₂ + H₂',
          'OH⁻ simply evaporates',
        ],
        correctIndex: 1,
      },
      {
        id: 'b4',
        question: 'What happens if you add far too much acid or base — beyond the "buffer capacity"?',
        options: [
          'The buffer becomes more powerful',
          'The temperature drops to zero',
          'The buffer runs out of conjugate partner to react with, and the pH starts swinging like an unbuffered solution',
          'Nothing — buffers work forever',
        ],
        correctIndex: 2,
      },
      {
        id: 'b5',
        question: 'Why is the pH-buffering action of blood (carbonic acid / bicarbonate) so important?',
        options: [
          'Blood needs a low pH to flow',
          'Enzymes in the body only function within a narrow pH range — a buffer keeps blood pH near 7.4',
          'Buffers add energy to cells',
          'Buffers transport oxygen',
        ],
        correctIndex: 1,
      },
    ],
  },

  'ph-scale': {
    title: 'Acids & Bases Quiz — pH Lab',
    questions: [
      {
        id: 'phl1',
        question: 'You dilute 10 cm³ of 0.1 mol dm⁻³ HCl with water to a total volume of 100 cm³. How does the pH change?',
        options: [
          'It falls by 1 (more acidic)',
          'It stays the same',
          'It rises by 1, from 1 to 2',
          'It rises to 7',
        ],
        correctIndex: 2,
      },
      {
        id: 'phl2',
        question: 'You pour half of a 0.1 mol dm⁻³ HCl solution down the sink. What happens to the pH of the solution left in the beaker?',
        options: [
          'It rises, because there is less acid',
          'Nothing: the concentration is unchanged, so the pH is unchanged',
          'It halves',
          'It falls, because the acid left behind is more concentrated',
        ],
        correctIndex: 1,
      },
      {
        id: 'phl3',
        question: 'Diluting HCl 10 times raises its pH by 1, but diluting CH₃COOH 10 times raises it by only about 0.5. Why?',
        options: [
          'As a weak acid is diluted, a larger fraction of it ionises, replacing some of the H⁺ lost to dilution',
          'Water reacts with HCl but not with CH₃COOH',
          'CH₃COOH does not mix with water',
          'The pH meter is less accurate for weak acids',
        ],
        correctIndex: 0,
      },
      {
        id: 'phl4',
        question: 'When CH₃COOH is titrated with NaOH, the pH at the equivalence point is about 8.7. Which indicator should you use?',
        options: [
          'Methyl orange (changes colour at pH 3.1–4.4)',
          'Methyl red (pH 4.4–6.2)',
          'Bromothymol blue (pH 6.0–7.6)',
          'Phenolphthalein (pH 8.3–10.0)',
        ],
        correctIndex: 3,
      },
      {
        id: 'phl5',
        question: 'Pure water heated to 60 °C has a pH of about 6.5. Is it acidic?',
        options: [
          'Yes: any pH below 7 is acidic',
          'Yes: heating releases H⁺ ions but no OH⁻ ions',
          'No: [H⁺] still equals [OH⁻], so the water is neutral',
          'No: a pH meter does not work in hot water',
        ],
        correctIndex: 2,
      },
      {
        id: 'phl6',
        question: 'Some water evaporates from a beaker of NaOH solution. What happens to its pH?',
        options: [
          'It moves closer to 7',
          'It rises: the same amount of NaOH is now in less water',
          'It stays the same',
          'It falls below 7',
        ],
        correctIndex: 1,
      },
    ],
  },
}
