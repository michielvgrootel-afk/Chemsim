// Quizzes for the Intermolecular Forces module
// Schema matches rates-of-reaction/quiz.js:
//   { title, questions: [{ id, question, options, correctIndex }] }

export const imfQuizzes = {
  'london-dispersion': {
    title: 'Intermolecular Forces Quiz — London Dispersion',
    questions: [
      {
        id: 'ldf1',
        question: 'Why does octane (C₈H₁₈) have a much higher boiling point than methane (CH₄)?',
        options: [
          'Octane has stronger covalent bonds, which have to break when it boils',
          'Octane has more electrons and a longer surface, so the London forces between its molecules are stronger',
          'Octane molecules are polar and methane molecules are not',
          'Octane is heavier, so gravity holds its molecules down',
        ],
        correctIndex: 1,
      },
      {
        id: 'ldf2',
        question: 'What causes a temporary (instantaneous) dipole in a non-polar molecule?',
        options: [
          'At any instant the electrons can be unevenly spread, making one part slightly negative (δ−) and another slightly positive (δ+)',
          'One atom is more electronegative and always pulls the electrons towards itself',
          'The molecule loses an electron to its neighbour',
          'The nuclei move to one end of the molecule',
        ],
        correctIndex: 0,
      },
      {
        id: 'ldf3',
        question: 'Pentane boils at 36 °C and 2,2-dimethylpropane at 10 °C. Both are C₅H₁₂ with 42 electrons. Why is the boiling point of 2,2-dimethylpropane lower?',
        options: [
          'It has fewer electrons',
          'Its C–H bonds are weaker',
          'It is more polar',
          'Its compact, ball-like shape touches its neighbours over a smaller area, so the London forces are weaker',
        ],
        correctIndex: 3,
      },
      {
        id: 'ldf4',
        question: 'When butane boils, what is overcome?',
        options: [
          'The C–C and C–H covalent bonds inside the molecules',
          'The attraction between the electrons and the nuclei in each atom',
          'The London forces between the molecules',
          'Ionic bonds between the molecules',
        ],
        correctIndex: 2,
      },
      {
        id: 'ldf5',
        question: 'At room temperature chlorine is a gas, bromine a liquid and iodine a solid. What explains this trend?',
        options: [
          'From Cl₂ to I₂ the molecules have more electrons in bigger electron clouds, so the London forces get stronger',
          'From Cl₂ to I₂ the covalent bond between the two atoms gets stronger',
          'Iodine molecules are polar',
          'Iodine molecules form hydrogen bonds',
        ],
        correctIndex: 0,
      },
      {
        id: 'ldf6',
        question: 'Ethanol (78 °C) boils at a much higher temperature than propane (−42 °C), although both have 26 electrons. Why?',
        options: [
          'Ethanol has more electrons',
          'Propane has a larger surface area',
          'Ethanol’s covalent bonds are stronger',
          'Ethanol molecules also form hydrogen bonds (O–H···O), which are much stronger than London forces',
        ],
        correctIndex: 3,
      },
    ],
  },
}
