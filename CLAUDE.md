# ChemSim — Developer & AI Onboarding Guide

## What Is ChemSim?

ChemSim is a **browser-based interactive chemistry simulation platform** for high school students (IB/MYP5, ~15-16 years old). Students manipulate variables (temperature, concentration, catalyst) and observe real-time particle animations, graphs, and annotations that make invisible chemistry visible.

- **Live:** https://michielvgrootel-afk.github.io/Chemsim
- **Repo:** https://github.com/michielvgrootel-afk/Chemsim
- **PRD:** See `ChemSim_PRD_v0.5.docx` in the parent directory

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19 |
| Build | Vite | 7 |
| Styling | Tailwind CSS | 4 |
| Charting | Recharts | 3.8 |
| Rendering | HTML5 Canvas 2D | — |
| Hosting | GitHub Pages (docs/ folder) | — |
| State | React hooks (no Redux) | — |
| Persistence | localStorage | — |

## Project Structure

```
src/
├── App.jsx                    # Screen router (FRONT → SIMULATION → TEACHER)
├── main.jsx                   # React entry point
├── index.css                  # Tailwind imports
│
├── components/
│   ├── FrontPage.jsx          # Reaction picker + student name input
│   ├── SimulationPage.jsx     # Main sim UI (canvas + graph + controls)
│   ├── Canvas.jsx             # HTML5 Canvas with high-DPI scaling
│   ├── LiveGraph.jsx          # Recharts LineChart with line toggle
│   ├── VariablePanel.jsx      # Sliders (temp, concentration, particle counts)
│   ├── StatusBar.jsx          # Stats display + quiz button
│   ├── TopBar.jsx             # Header + reaction switcher
│   ├── QuizModal.jsx          # MCQ quiz interface
│   ├── ConfirmModal.jsx       # Reaction switch confirmation
│   ├── LoadingScreen.jsx      # Initial loading animation
│   └── ErrorBoundary.jsx      # React error boundary
│
├── engine/
│   ├── particle.js            # Particle class (position, velocity, physics)
│   ├── collisionDetector.js   # Elastic collision detection + response
│   ├── spatialGrid.js         # O(n) spatial hash grid for collision culling
│   ├── gameLoop.js            # requestAnimationFrame loop
│   ├── renderer.js            # Canvas drawing (particles, catalyst, grid)
│   ├── spriteCache.js         # Pre-rendered particle sprites for perf
│   └── catalystSurface.js     # Heterogeneous catalyst for Haber process
│
├── hooks/
│   ├── useSimulation.js       # Master hook: particles, reactions, graph, annotations
│   ├── useGameLoop.js         # Game loop state (pause/resume/reset)
│   └── useLocalStorage.js     # localStorage wrapper
│
├── modules/
│   ├── registry.js            # Module registry (currently: rates-of-reaction)
│   └── rates-of-reaction/
│       ├── index.js           # Reaction list + quiz getter
│       ├── quiz.js            # MCQ questions (5 per reaction)
│       └── reactions/
│           ├── general.js     # A + B → C (teaching model)
│           ├── aspirin.js     # ASA + H₂O → Salicylic Acid + Acetic Acid
│           ├── fermentation.js # C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂ (enzyme)
│           └── haber.js       # N₂ + 3H₂ ⇌ 2NH₃ (reversible, catalyst surface)
│
├── teacher/
│   ├── TeacherDashboard.jsx   # PIN-protected teacher panel
│   ├── PinEntry.jsx           # PIN setup/entry
│   ├── ModuleManager.jsx      # Toggle reactions on/off, shareable links
│   ├── QuizResults.jsx        # Quiz result history
│   └── AssignmentNotes.jsx    # Teacher notes per reaction
│
└── utils/
    ├── constants.js           # Colors, defaults, screen names, storage keys
    ├── storage.js             # localStorage helpers
    └── csvExport.js           # CSV export for quiz results
```

## Architecture

### Data Flow
```
App (screen router)
 ├── FrontPage → user picks reaction + enters name → SIMULATION
 ├── SimulationPage
 │    ├── useSimulation (master orchestrator)
 │    │    ├── Initializes particles from reaction config
 │    │    ├── update(dt) each frame:
 │    │    │    ├── Physics (particle.update)
 │    │    │    ├── Catalyst surface (Haber only)
 │    │    │    ├── SpatialGrid collision culling
 │    │    │    ├── Collision detection
 │    │    │    ├── Reaction rules (stoichiometry check)
 │    │    │    └── Product spawning + stats
 │    │    └── draw() → renderer.js → Canvas
 │    ├── LiveGraph (Recharts)
 │    ├── VariablePanel (sliders)
 │    └── StatusBar (quiz button)
 └── TeacherDashboard (PIN-gated)
```

### How Reactions Work
Each reaction is a config object in `src/modules/rates-of-reaction/reactions/`. The config defines:

- **`particleTypes`** — Array of `{ id, name, color, shape, size, role }` (role: reactant/product/catalyst)
- **`variables`** — Array of slider/toggle definitions with min/max/default
- **`speedFromTemp(temp)`** — Returns particle speed for a given temperature
- **`particleCount(totalParticles, vars)`** — Returns count per particle type
- **`reactionRules`** — Array of `{ reactants, products, activationEnergy, ... }` defining stoichiometry
- **`graphConfig`** — Which particle types to plot, axis labels
- **`annotations`** — Context-aware tips triggered by variable conditions
- **`quiz`** — MCQ questions (in quiz.js)

### Adding a New Reaction
1. Create a new file in `src/modules/rates-of-reaction/reactions/`
2. Export a config object following the standard interface (copy `general.js` as template)
3. Add the reaction to the `reactions` array in `src/modules/rates-of-reaction/index.js`
4. Add quiz questions to `src/modules/rates-of-reaction/quiz.js`

### Adding a New Module
1. Create a new folder in `src/modules/` (e.g., `collision-theory/`)
2. Export `{ id, name, description, reactions, getQuiz }` from its `index.js`
3. Register it in `src/modules/registry.js`

## Key Design Decisions

- **Pedagogical accuracy over physical accuracy.** Particle counts are illustrative. The goal is that students see and understand the chemistry concepts, not run a physically exact simulation.
- **Enzyme kinetics use a non-linear activity curve** (fermentation): peak at 37°C, denaturation above 60°C.
- **Haber uses heterogeneous catalysis** with a visible iron surface: particles adsorb → diffuse → react → desorb.
- **Equilibrium** is modelled probabilistically: an `equilibriumModifier` function shifts forward/reverse probability based on temperature and pressure.
- **Colour-blind accessibility:** Every particle type has a distinct shape (circle, diamond, triangle, hexagon, star) in addition to colour.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Vite, hot reload)
npm run build        # Production build → dist/
```

### Deploying to GitHub Pages
After building, copy `dist/` contents to `docs/`:
```bash
npm run build
rm -rf docs/*
cp -r dist/* docs/
git add docs/ && git commit -m "Update docs/ with latest build"
git push
```
The repo is configured to serve from the `docs/` folder on the `main` branch.

## Coding Conventions

- **No TypeScript** — plain JavaScript with JSX
- **Functional components only** — no class components
- **Custom hooks** for simulation logic (`useSimulation`, `useGameLoop`)
- **Dark theme** with accessible colours defined in `constants.js`
- **Keep dependencies minimal** — currently only React, Recharts, Tailwind
- **Reaction configs are pure data** — no React imports, no side effects
- **Vite base path** is `'./'` for GitHub Pages compatibility

## Known Issues / Active Work

- **Fermentation enzyme denaturing:** Currently modelled as a speed curve but enzyme particles don't visually denature. Planned: visible denaturing at specified temperature, enzyme shape/colour change, teaching tool for enzyme function.
- **No Phase 2 modules yet:** Collision theory, standalone equilibrium, acid-base are planned but not started.

## Important Notes for AI Developers

1. **Read the reaction config files** before modifying simulation behaviour — they are the source of truth for how each reaction works.
2. **Test on the dev server** (`npm run dev`) before committing — the simulation runs at 60fps and bugs are immediately visible.
3. **Don't add unnecessary dependencies.** This runs on school laptops with spotty internet. Keep the bundle small.
4. **The `docs/` folder is the deployed site.** Always rebuild and copy to `docs/` after changes.
5. **localStorage is the only persistence.** No backend, no database, no auth server.
6. **Check `useSimulation.js`** for the main simulation loop — this is where physics, collisions, and reactions happen each frame.
