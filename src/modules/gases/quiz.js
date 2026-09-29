// Quiz for the Gases module
// Schema matches rates-of-reaction/quiz.js:
//   { title, questions: [{ id, question, options, correctIndex }] }

export const gasesQuizzes = {
  'gas-laws': {
    title: 'Gases Quiz — Ideal Gas Laws',
    questions: [
      {
        id: 'gas1',
        question: 'What causes the pressure of a gas in a container?',
        options: [
          'Particles pushing each other apart',
          'Particles colliding with the walls of the container',
          'The weight of the particles resting on the bottom',
          'Attractions between the particles and the walls',
        ],
        correctIndex: 1,
      },
      {
        id: 'gas2',
        question: 'At constant temperature, the volume of a fixed amount of gas is halved. What happens to the pressure?',
        options: ['It halves', 'It stays the same', 'It doubles', 'It increases four times'],
        correctIndex: 2,
      },
      {
        id: 'gas3',
        question: 'Why must temperature be in kelvin, not °C, in gas law calculations?',
        options: [
          'Kelvin values are always larger, so answers are more precise',
          'The data booklet only lists kelvin values',
          'Gases cannot exist below 0 °C',
          'Pressure and volume are proportional to the absolute temperature, which is zero at 0 K',
        ],
        correctIndex: 3,
      },
      {
        id: 'gas4',
        question: 'Under which conditions does a real gas deviate most from ideal behaviour?',
        options: [
          'Low temperature and high pressure',
          'High temperature and low pressure',
          'High temperature and high volume',
          'Low pressure and large volume',
        ],
        correctIndex: 0,
      },
      {
        id: 'gas5',
        question: 'A container of helium and a container of carbon dioxide have the same volume, temperature and pressure. Which statement is correct?',
        options: [
          'The CO₂ container holds more particles because CO₂ molecules are larger',
          'The helium container holds more particles because helium moves faster',
          'Both containers hold the same number of particles',
          'It depends on the masses of the gases',
        ],
        correctIndex: 2,
      },
    ],
  },
}
