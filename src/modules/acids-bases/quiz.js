// Quizzes for the Acids, Bases & Buffers module
// Schema matches rates-of-reaction/quiz.js:
//   { title, questions: [{ id, question, options, correctIndex }] }

export const acidsBasesQuizzes = {
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
