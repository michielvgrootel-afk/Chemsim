// ChemSim color palette - colour-blind-friendly
export const COLORS = {
  bg: '#1a1d24',
  surface: '#22262f',
  surface2: '#2a2f3a',
  border: '#363c4a',
  border2: '#454d5e',
  text: '#e8eaf0',
  muted: '#6b7585',
  muted2: '#8a95a8',
  accent: '#4f9cf0',
  accent2: '#2d7be0',
  green: '#3dba7e',
  orange: '#f0913a',
  red: '#e05555',
  purple: '#9b6ef0',
  yellow: '#f0c040',
  blue: '#4f9cf0',
}

// Particle type colors (accessible - distinct hues + shapes)
export const PARTICLE_COLORS = {
  A: '#4f9cf0',        // Blue
  B: '#f0913a',        // Orange
  C: '#3dba7e',        // Green
  catalyst: '#9b6ef0', // Purple
  N2: '#4f9cf0',       // Blue
  H2: '#f0c040',       // Yellow
  NH3: '#3dba7e',      // Green
  ASA: '#4f9cf0',      // Blue
  salicylic: '#f0913a',// Orange
  acetic: '#3dba7e',   // Green
  water: '#8a95a8',    // Gray
  glucose: '#f0c040',  // Yellow
  ethanol: '#3dba7e',  // Green
  CO2: '#e05555',      // Red
  enzyme: '#9b6ef0',   // Purple
}

// Particle shapes for accessibility (not just color)
export const PARTICLE_SHAPES = {
  A: 'circle',
  B: 'diamond',
  C: 'triangle',
  catalyst: 'star',
}

// Simulation defaults
export const SIM_DEFAULTS = {
  particleCount: 30,
  minParticles: 10,
  maxParticles: 100,
  temperature: 25,
  minTemp: 0,
  maxTemp: 100,
  concentration: 0.5,
  minConc: 0.1,
  maxConc: 2.0,
  catalystActive: false,
  targetFPS: 30,
  canvasWidth: 800,
  canvasHeight: 500,
  gridCellSize: 50,
  particleRadius: 12,
  resetDebounceMs: 500,
}

// Graph settings
export const GRAPH_CONFIG = {
  updateIntervalMs: 300,
  maxDataPoints: 200,
  strokeWidth: 2,
}

// Screen identifiers
export const SCREENS = {
  FRONT: 'front',
  SIMULATION: 'simulation',
  TEACHER: 'teacher',
}

// localStorage keys
export const STORAGE_KEYS = {
  PIN: 'chemsim_pin',
  ACTIVE_MODULES: 'chemsim_active_modules',
  QUIZ_RESULTS: 'chemsim_quiz_results',
  ASSIGNMENT_NOTES: 'chemsim_assignment_notes',
}
