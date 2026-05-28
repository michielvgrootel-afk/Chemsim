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
          'A strong acid fully ionises in water; a weak acid only partially ionises',
          'A strong acid is more concentrated than a weak acid',
          'A strong acid contains more hydrogen atoms than a weak acid',
          'A strong acid has a higher boiling point',
        ],
        correctIndex: 0,
      },
      {
        id: 'sw2',
        question: 'If you dissolve 100 HCl molecules in water, roughly how many H⁺ ions will be present at equilibrium?',
        options: ['About 100 (full dissociation)', 'About 50', 'About 5', 'Zero'],
        correctIndex: 0,
      },
      {
        id: 'sw3',
        question: 'If you dissolve 100 CH₃COOH molecules in water, roughly how many H⁺ ions will be present at equilibrium?',
        options: ['About 1-5 (only a few percent dissociate)', 'About 100', 'About 50', 'Zero'],
        correctIndex: 0,
      },
      {
        id: 'sw4',
        question: 'Why does CH₃COOH stay mostly intact in water, even though HCl falls apart immediately?',
        options: [
          'The H–O bond in CH₃COOH is stronger than the H–Cl bond in HCl, so it resists breaking',
          'CH₃COOH is heavier than HCl',
          'CH₃COOH doesn’t contain hydrogen',
          'Water rejects CH₃COOH',
        ],
        correctIndex: 0,
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
        options: ['H₂O (water)', 'H₂', 'O₂', 'HCl'],
        correctIndex: 0,
      },
      {
        id: 'n2',
        question: 'What role does Na⁺ play in the neutralisation of HCl with NaOH?',
        options: [
          'It is a spectator ion — it doesn’t react, it just stays dissolved',
          'It reacts with Cl⁻ to form a precipitate',
          'It catalyses the reaction',
          'It changes colour',
        ],
        correctIndex: 0,
      },
      {
        id: 'n3',
        question: 'In the simulation, why does the indicator change colour as you add NaOH drops?',
        options: [
          'The H⁺/OH⁻ ratio in the solution changes, and the indicator responds to that ratio',
          'The NaOH chemically bonds to the indicator',
          'The temperature rises',
          'The indicator dissolves',
        ],
        correctIndex: 0,
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
          'Add more HCl — its H⁺ ions will react with the excess OH⁻',
          'Heat the solution',
          'Add more water — that will neutralise it',
          'Wait — the pH will return on its own',
        ],
        correctIndex: 0,
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
          'The added H⁺ ions react with the conjugate base (CH₃COO⁻) → CH₃COOH, so the free H⁺ concentration stays nearly constant',
          'HCl doesn’t dissociate in a buffer',
          'The buffer evaporates the added acid',
          'The buffer heats up and neutralises the acid',
        ],
        correctIndex: 0,
      },
      {
        id: 'b3',
        question: 'When you add NaOH to a buffer, what reaction absorbs it?',
        options: [
          'OH⁻ + CH₃COOH → CH₃COO⁻ + H₂O',
          'OH⁻ + Na⁺ → NaOH again',
          'OH⁻ → O₂ + H₂',
          'OH⁻ simply evaporates',
        ],
        correctIndex: 0,
      },
      {
        id: 'b4',
        question: 'What happens if you add far too much acid or base — beyond the "buffer capacity"?',
        options: [
          'The buffer runs out of conjugate partner to react with, and the pH starts swinging like an unbuffered solution',
          'The buffer becomes more powerful',
          'The temperature drops to zero',
          'Nothing — buffers work forever',
        ],
        correctIndex: 0,
      },
      {
        id: 'b5',
        question: 'Why is the pH-buffering action of blood (carbonic acid / bicarbonate) so important?',
        options: [
          'Enzymes in the body only function within a narrow pH range — a buffer keeps blood pH near 7.4',
          'Blood needs a low pH to flow',
          'Buffers add energy to cells',
          'Buffers transport oxygen',
        ],
        correctIndex: 0,
      },
    ],
  },

  'ph-scale': {
    title: 'Acids & Bases Quiz — pH Scale',
    questions: [
      {
        id: 'phs1',
        question: 'What does a low pH (e.g. pH 2) mean at the molecular level?',
        options: [
          'There are many H⁺ ions per OH⁻ ion',
          'There are many OH⁻ ions per H⁺ ion',
          'The solution has no ions',
          'The solution is at a high temperature',
        ],
        correctIndex: 0,
      },
      {
        id: 'phs2',
        question: 'Why does adding HCl swing the pH down faster than adding the same amount of CH₃COOH?',
        options: [
          'HCl is a strong acid — every molecule fully ionises into H⁺ + Cl⁻. CH₃COOH is weak — only ~5 % ionise.',
          'HCl is hotter than CH₃COOH',
          'CH₃COOH doesn’t actually contain hydrogen',
          'HCl molecules are smaller',
        ],
        correctIndex: 0,
      },
      {
        id: 'phs3',
        question: 'The pH scale is logarithmic. A solution at pH 4 has how many times more H⁺ ions than one at pH 6?',
        options: ['100×', '2×', '10×', '4×'],
        correctIndex: 0,
      },
      {
        id: 'phs4',
        question: 'When H⁺ and OH⁻ ions collide in the simulation, what do they form?',
        options: ['Water (H₂O)', 'Salt', 'Hydrogen gas', 'Nothing — they bounce off'],
        correctIndex: 0,
      },
      {
        id: 'phs5',
        question: 'Why does the universal indicator change colour smoothly through the pH range?',
        options: [
          'It responds to the ratio of H⁺ to OH⁻ in its environment',
          'It heats up as more acid is added',
          'It dissolves more at extreme pH',
          'It changes randomly',
        ],
        correctIndex: 0,
      },
    ],
  },
}
