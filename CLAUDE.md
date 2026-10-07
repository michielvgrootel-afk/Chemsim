# ChemSim — Developer & AI Onboarding Guide

## What Is ChemSim?

ChemSim is a **browser-based interactive chemistry simulation platform** for secondary school students: MYP 5 (~15–16 years old) and IB Chemistry DP 1 / DP 2 (~16–18). Students change variables (temperature, concentration, catalyst, stirring, volume, drops of acid or base) and watch real-time particle animations, live graphs and annotations that make invisible chemistry visible. Each simulation ends with a short multiple-choice quiz. Students don't log in or enter a name.

- **Live:** https://michielvgrootel-afk.github.io/Chemsim
- **Repo:** https://github.com/michielvgrootel-afk/Chemsim
- **PRD:** See `ChemSim_PRD_v0.5.docx` in the parent directory (written before the Solubility, Gases and Acids & Bases modules)

### Modules and simulations

| Module | Simulation (`id`) | Year groups | IB ref |
|--------|-------------------|-------------|--------|
| Rates of Reaction | General Model (`general`) | MYP5, DP1 | R2.2 |
| | Hydrolysis of Aspirin (`aspirin`) | MYP5 | — |
| | Fermentation of Glucose (`fermentation`) | MYP5 | — |
| | Haber Process (`haber`) | MYP5, DP1 | R2.3 |
| Solubility | Salt in Water (`nacl-water`) | MYP5, DP1 | S2.1 |
| | Oil in Water (`oil-water`) | MYP5, DP1 | S2.2 |
| Gases | Ideal Gas Laws (`gas-laws`) | DP1 | S1.5 |
| Acids & Bases | Strong vs Weak Acid (`strong-vs-weak`) | DP2 | R3.1.6 |
| | Neutralisation (`neutralization`) | MYP5, DP2 | R3.1.7 |
| | Buffer Demonstration (`buffer`) | DP2 | R3.1.16 (HL) |
| | pH Scale Sandbox (`ph-scale`) | MYP5, DP2 | R3.1.4 |

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
├── App.jsx                    # Screen router (FRONT → SIMULATION → TEACHER); reads ?reaction=<id>
├── main.jsx                   # React entry point
├── index.css                  # Tailwind imports
│
├── components/
│   ├── FrontPage.jsx          # Year-group tabs (MYP 5 / DP 1 / DP 2), simulations grouped by module
│   ├── SimulationPage.jsx     # Main sim UI (canvas + graph + controls); opens paused
│   ├── Canvas.jsx             # HTML5 Canvas with high-DPI scaling
│   ├── LiveGraph.jsx          # Recharts line chart with line toggle, or XY scatter plots (gases)
│   ├── VariablePanel.jsx      # Sliders, toggles, "Add drop" buttons, Starting Setup controls
│   ├── StatusBar.jsx          # Live stats (rate, % dissolved, pH, P/V/T…) + quiz button
│   ├── TopBar.jsx             # Header + switcher between the module's simulations
│   ├── QuizModal.jsx          # MCQ quiz interface
│   ├── ConfirmModal.jsx       # Simulation switch confirmation
│   ├── LoadingScreen.jsx      # Initial loading animation
│   └── ErrorBoundary.jsx      # React error boundary ("Something went wrong")
│
├── engine/
│   ├── particle.js            # Particle class (position, velocity, physics)
│   ├── collisionDetector.js   # Elastic collision detection + response
│   ├── spatialGrid.js         # O(n) spatial hash grid for collision culling
│   ├── gameLoop.js            # requestAnimationFrame loop (setTimeout fallback when hidden)
│   ├── renderer.js            # Canvas drawing (particles, catalyst surface, gas piston, grid)
│   ├── spriteCache.js         # Pre-rendered particle sprites (incl. water, oil chain, emulsifier)
│   ├── catalystSurface.js     # Heterogeneous catalyst for Haber process
│   ├── polarityForces.js      # Solubility forces, stirring flow fields, % dissolved / separated
│   ├── crystal.js             # Undissolved NaCl crystal moving as one rigid body
│   ├── emulsifier.js          # Soap molecules binding oil and water (Oil in Water)
│   ├── gasUtils.js            # Gas units, piston volume, pressure, van der Waals
│   └── acidBaseUtils.js       # pH calculation, indicator colours, "Add drop" spawning
│
├── hooks/
│   ├── useSimulation.js       # Master hook: particles, physics, reactions, graph, annotations
│   ├── useGameLoop.js         # Game loop state (pause/resume/reset)
│   └── useLocalStorage.js     # localStorage wrapper
│
├── modules/
│   ├── registry.js            # Module registry: ratesOfReaction, solubility, gases, acidsBases
│   ├── rates-of-reaction/     # general, aspirin, fermentation, haber
│   ├── solubility/            # nacl-water, oil-water
│   ├── gases/                 # gas-laws
│   └── acids-bases/           # strong-vs-weak, neutralization, buffer, ph-scale
│                              # each module: index.js (module + simulation list),
│                              # quiz.js (quizzes), reactions/ (one config file per simulation)
│
├── teacher/
│   ├── TeacherDashboard.jsx   # PIN-protected teacher panel (all modules)
│   ├── PinEntry.jsx           # PIN setup/entry
│   ├── ModuleManager.jsx      # Turn simulations on/off, shareable ?reaction= links
│   ├── QuizResults.jsx        # Quiz result history (anonymous)
│   └── AssignmentNotes.jsx    # Teacher notes per simulation
│
└── utils/
    ├── constants.js           # Colours, defaults, YEAR_GROUPS, screen names, storage keys
    ├── storage.js             # Safe localStorage helpers
    └── csvExport.js           # CSV export for quiz results
```

## Architecture

### Data Flow
```
App (screen router)
 ├── FrontPage → pick a year group + simulation → SIMULATION   (?reaction=<id> preselects one)
 ├── SimulationPage (opens paused)
 │    ├── useSimulation (master orchestrator)
 │    │    ├── initSimulation: spawns particles from the scenario config
 │    │    │   (random, NaCl crystal lattice, mixed oil/water, or gas container)
 │    │    ├── update(dt) each frame:
 │    │    │    ├── Temperature → target speed; particle movement
 │    │    │    ├── Crystal, catalyst surface, enzyme denaturing, emulsifiers
 │    │    │    ├── SpatialGrid
 │    │    │    ├── Polarity forces, hydration shells, stirring (solubility)
 │    │    │    ├── Collisions; pressure (gases)
 │    │    │    ├── Reaction rules (colliding reactants with enough energy react)
 │    │    │    └── Stats, graph points, pH, annotations
 │    │    └── draw() → renderer.js → Canvas
 │    ├── LiveGraph (Recharts)
 │    ├── VariablePanel (sliders, toggles, buttons, setup controls)
 │    └── StatusBar (stats + quiz button)
 └── TeacherDashboard (PIN-gated)
```

### How Simulations Work
Each simulation is a config object in `src/modules/<module>/reactions/`. Keys every config uses:

- **`id`, `name`, `subtitle`, `description`, `guidingQuestion`, `assignmentGoal`**
- **`yearGroups`** — e.g. `['MYP5', 'DP1']`. The front page lists a simulation only under these year groups (`YEAR_GROUPS` in `constants.js`).
- **`syllabusRef`** — IB syllabus code shown on DP cards (e.g. `'S2.1'`)
- **`particleTypes`** — `[{ type, label, color, shape, radius, mass }]`, optionally `polarity`, `charge`, `buoyancy`, `hideLabel`. Shapes: circle, diamond, triangle, star, hexagon, square, cracked, water, oil, emulsifier.
- **`variables`** — controls. A slider by default (`min`, `max`, `step`, `default`, `unit`); `type: 'toggle'`; or `type: 'button'` (e.g. "Add drop", with `spawn` and `cooldownMs`). Optional `tooltip`, `icon`, `visibleWhen(values)`, `formatValue(value)`.
- **`speedFromTemp(temp)`** — particle speed factor (× 60 px/s) at a temperature
- **Particle numbers** — `initialRatio` + `countFromConc(conc, total)` (Rates of Reaction), or `totalParticles` + `maxParticleCount` + `initialRatio`, or **`setupControls`**: sliders that replace the per-type particle sliders; their values reach `initSimulation` by control `id` (e.g. Salt in Water's crystal size).
- **`reactions`** — reaction rules `[{ reactants, products, ... }]`; empty for force-based simulations such as Solubility
- **`graph`** — `{ lines: [{ key, label, color }], xLabel, yLabel }` (optional `yDomain` etc.), or `type: 'xy'` with `plots` (Gases)
- **`annotations`** — `[{ id, text, condition }]`, where `condition` is `'always'` or `(vars, stats) => boolean`

Module-specific keys (read the existing configs before changing these):

- **Rates of Reaction:** `activationEnergy` (relative), `catalystReduction`, `activationEnergyKJ` / `activationEnergyWithCatalystKJ` (display only), `denature` (fermentation), `hasCatalystSurface` + `homogeneousGate` (Haber), `equilibriumModifier` + `reversible`
- **Solubility:** `hasPolarityForces`, `soluteTypes`, `solventTypes`, `spawnMode` (`'lattice'`, `'mixed'` or `'cluster'`), `latticeConfig`, `hydrationConfig`, `polarityConfig` (incl. `forceReferenceTemp`), `stirConfig`, `crystalConfig`, `immiscible`, `emulsifierConfig`
- **Gases:** `gasConfig` (volume range, piston, mol per particle, real-gas settings, van der Waals a and b)
- **Acids & Bases:** `phConfig`, `indicatorConfig`, `randomGate`, `equilibriumModifier`

Quizzes live in each module's `quiz.js`, keyed by simulation id: `{ title, questions: [{ id, question, options, correctIndex }] }`. Options are shown in the order written, so spread the correct answers across A–D.

### Adding a New Simulation
1. Create a config file in `src/modules/<module>/reactions/` (copy the closest existing one; `general.js` is the simplest)
2. Add it to the `reactions` array in that module's `index.js`
3. Give it `yearGroups` (and `syllabusRef` for DP) so it appears on the front page
4. Add its quiz to the module's `quiz.js`

### Adding a New Module
1. Create a new folder in `src/modules/` (e.g. `equilibrium/`)
2. Export `{ id, name, level, description, reactions, getReaction, getQuiz }` from its `index.js`
3. Register it in `src/modules/registry.js`

The teacher's on/off list is one flat array of simulation ids. A module with none of its ids in that list shows all its simulations (`getEnabledReactions`), so new simulations appear without any teacher setup.

## Key Design Decisions

- **Pedagogical accuracy over physical accuracy.** Particle counts are illustrative. The goal is that students see and understand the chemistry concepts, not run a physically exact simulation.
- **Temperature acts through particle speed** (`speedFromTemp`), exaggerated so students can see it. Where attractions matter (Salt in Water), forces scale with kinetic energy (`forceReferenceTemp`) so fast particles are still captured; with fixed forces, salt dissolved *more slowly* in hot water.
- **Enzyme kinetics** (fermentation): activity peaks at 37 °C; above 55 °C enzymes visibly denature (grey, cracked shape), rapidly above 65 °C.
- **Haber uses heterogeneous catalysis** with a visible iron surface: particles adsorb → diffuse → react → desorb.
- **Equilibrium** is modelled probabilistically: an `equilibriumModifier` function shifts forward/reverse probability based on temperature and pressure.
- **Salt in Water:** an ion leaves the crystal only when enough water molecules surround it (Na⁺ 5, Cl⁻ 6); ion sizes follow real ionic radii; when stirred, the undissolved crystal moves as one rigid solid.
- **Gases:** ideal-gas pressure is measured from particle–wall collisions; real-gas mode shows larger, attracting particles but takes its pressure from the van der Waals equation.
- **Molecules are drawn as recognisable structures** (bent H₂O, a long hydrocarbon chain for oil, a head-and-tail emulsifier) but collide as circles. A drawing may reach beyond its circle (`SPRITE_REACH` in `spriteCache.js`).
- **Colour-blind accessibility:** Every particle type has a distinct shape (circle, diamond, triangle, hexagon, star, …) in addition to colour.
- **Simulations open paused** so students can read the opening annotation first.
- **No student accounts or names;** quiz results are stored anonymously in localStorage.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Vite, hot reload) at http://localhost:5173
npm run build        # Production build → dist/
```

`.claude/launch.json` says port 5174, but Vite serves on 5173; open http://localhost:5173.

### Deploying to GitHub Pages
After building, copy `dist/` contents to `docs/`:
```bash
npm run build
rm -rf docs/*
cp -r dist/* docs/
git add docs/ && git commit -m "Update docs/ with latest build"
git push
```
The repo is configured to serve from the `docs/` folder on the `main` branch. Commit the source changes together with `docs/`. `dist/` is still tracked from an old commit but is not deployed: never stage it.

## Coding Conventions

- **No TypeScript** — plain JavaScript with JSX
- **Functional components only** — no class components
- **Custom hooks** for simulation logic (`useSimulation`, `useGameLoop`)
- **Dark theme** with accessible colours defined in `constants.js`
- **Keep dependencies minimal** — currently only React, Recharts, Tailwind
- **Reaction configs are pure data** — no React imports, no side effects
- **Vite base path** is `'./'` for GitHub Pages compatibility

## Known Issues / Active Work

- **"% Dissolved" (Salt in Water)** counts an ion the first time it breaks free. Freed ions whose water shell thins freeze again next to the crystal, so at 50 % the crystal can still look almost whole.
- **Oil chains overlap visually** in the oil layer, because they are drawn longer than their collision circles.
- **Bundle size:** the JS bundle is ~700 kB, so Vite warns about chunk size. That's fine for now, but avoid heavy new dependencies.
- **Planned, not started:** collision theory, standalone equilibrium.

## Important Notes for AI Developers

1. **Read the scenario config files** before modifying simulation behaviour — they are the source of truth for how each simulation works.
2. **Test on the dev server** (`npm run dev`) before committing — the simulation runs at 60fps and bugs are immediately visible.
3. **Don't add unnecessary dependencies.** This runs on school laptops with spotty internet. Keep the bundle small.
4. **The `docs/` folder is the deployed site.** Always rebuild and copy to `docs/` when committing changes.
5. **localStorage is the only persistence.** No backend, no database, no auth server.
6. **Check `useSimulation.js`** for the main simulation loop — this is where physics, collisions, and reactions happen each frame.
7. **Commit and push only when the teacher asks.** They say "commit" and "push" explicitly and check the result on the live site.
8. **Measuring behaviour** (e.g. how long salt takes to dissolve): a hidden browser tab or pane throttles the animation, so real-time timing is unreliable. Instead, from the browser console, find the `GameLoop` through the canvas element's React fiber (`__reactFiber$…` → hook refs), set `loop.paused = true`, and call `loop.updateFn(1/60, loop.elapsed += 1/60)` in a loop. Single runs vary, so average several.
