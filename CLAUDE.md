# ChemSim — Developer & AI Onboarding Guide

## What Is ChemSim?

ChemSim is a **browser-based interactive chemistry simulation platform** for secondary school students: MYP 4–5 (~14–16 years old) and IB Chemistry DP 1 / DP 2 (~16–18). Students change variables (temperature, concentration, catalyst, stirring, volume, drops of acid or base) and watch real-time particle animations, live graphs and annotations that make invisible chemistry visible. Each simulation ends with a short multiple-choice quiz. Students don't log in or enter a name.

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
| | Maxwell–Boltzmann Distribution (`maxwell-boltzmann`) | MYP5, DP1 | R2.2 |
| Solubility | Salt in Water (`nacl-water`) | MYP5, DP1 | S2.1 |
| | Oil in Water (`oil-water`) | MYP5, DP1 | S2.2 |
| Intermolecular Forces | London Dispersion Forces (`london-dispersion`) | MYP4, MYP5, DP1 | S2.2 |
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

## Project Structure

```
src/
├── App.jsx                    # Screen router (FRONT → SIMULATION); reads ?reaction=<id>
├── main.jsx                   # React entry point
├── index.css                  # Tailwind imports
│
├── components/
│   ├── FrontPage.jsx          # Year-group tabs (MYP 4 / MYP 5 / DP 1 / DP 2), simulations grouped by module
│   ├── SimulationPage.jsx     # Main sim UI (canvas + graph + controls); opens paused.
│   │                          # A config with `page: 'ph-lab'`, `'imf-lab'` or `'mb-lab'` gets its own page
│   ├── Canvas.jsx             # HTML5 Canvas with high-DPI scaling
│   ├── LiveGraph.jsx          # Recharts line chart with line toggle, or XY scatter plots (gases)
│   ├── VariablePanel.jsx      # Sliders, toggles, "Add drop" buttons, Starting Setup controls
│   ├── StatusBar.jsx          # Live stats (rate, % dissolved, pH, P/V/T…) + quiz button
│   ├── TopBar.jsx             # Header + switcher between the module's simulations, "Copy link"
│   ├── QuizModal.jsx          # MCQ quiz: shows the score and correct answers, saves nothing
│   ├── ConfirmModal.jsx       # Simulation switch confirmation
│   ├── LoadingScreen.jsx      # Initial loading animation
│   ├── ErrorBoundary.jsx      # React error boundary ("Something went wrong")
│   ├── LabUI.jsx              # Card, Chip, ActionButton, Switch, Hint shared by the lab pages
│   ├── phlab/                 # pH Scale Sandbox page (no particles): PHLabPage, PHGraph,
│   │                          # Beaker (+ burette), LabControls, DataTable, NumbersPanel, format
│   ├── imflab/                # London Dispersion Forces page: IMFLabPage, MoleculeView (two
│   │                          # molecules with every electron, canvas), BPGraph (boiling points)
│   └── mblab/                 # Maxwell–Boltzmann page: MBLabPage, drawMB (box of particles +
│                              # energy graph with one dot per particle, both canvas)
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
│   ├── acidBaseUtils.js       # Particle pH (count ratio), indicator colours, "Add drop" spawning
│   ├── phLab.js               # pH lab chemistry: exact pH (charge balance, Ka/Kb/Kw), Kw(T),
│   │                          # dilution / pour out / evaporate, titration, indicator colours
│   ├── imfModel.js            # IMF lab: molecules (atoms, bonds, every electron) from displayed
│                              # formulas; fluctuating electron field (temporary/induced dipoles)
│   └── maxwellBoltzmann.js    # M–B curve (3D energies), fraction above Ea, particle sample whose
│                              # collisions share energy out (keeps the distribution)
│
├── hooks/
│   ├── useSimulation.js       # Master hook: particles, physics, reactions, graph, annotations
│   ├── useGameLoop.js         # Game loop state (pause/resume/reset)
│   └── usePHLab.js            # pH lab state: clock, pours, burette, undo, kept runs, predictions, table
│
├── modules/
│   ├── registry.js            # Module registry: ratesOfReaction, solubility, intermolecularForces,
│   │                          # gases, acidsBases
│   ├── rates-of-reaction/     # general, aspirin, fermentation, haber, maxwell-boltzmann
│   ├── solubility/            # nacl-water, oil-water
│   ├── intermolecular-forces/ # london-dispersion
│   ├── gases/                 # gas-laws
│   └── acids-bases/           # strong-vs-weak, neutralization, buffer, ph-scale
│                              # each module: index.js (module + simulation list),
│                              # quiz.js (quizzes), reactions/ (one config file per simulation)
│
└── utils/
    ├── constants.js           # Colours, defaults, YEAR_GROUPS + DEFAULT_YEAR, screen names
    └── csvExport.js           # CSV export (pH lab data table)
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
 ├── PHLabPage (instead of the above when the config has page: 'ph-lab')
 │    ├── usePHLab: beaker contents + clock; every change → phLab.analyse() → exact pH
 │    └── PHGraph (pH vs time or volume added), Beaker, controls, DataTable, NumbersPanel
 ├── IMFLabPage (page: 'imf-lab')
 │    ├── MoleculeView: two molecules, every electron; the top one's electrons shift towards or
 │    │   away from the lower one (temporary dipole), the lower one's are pushed the same way (induced)
 │    └── BPGraph (boiling points + temperature line), molecule facts, attraction meter, predict,
 │        a slider that turns the lower molecule (0° side by side → 90° end on)
 └── MBLabPage (page: 'mb-lab')
      └── one rAF loop: sample of particles (engine/maxwellBoltzmann.js) → drawBox + drawGraph;
          click a particle in either view to follow it; "Half speed" runs the sample's clock at half rate
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
- **pH Scale Sandbox** (`page: 'ph-lab'`, no particle keys): `substances` (`{ id, formula, type, strong, pKa | pKb, ion }`), `concentrations`, `addAmounts`, `removeAmounts`, `pourRate`, `beaker`, `titration`, `indicators` (`low`/`high` colour-change range), `temperature`. Its annotation `text` may be a function of `(vars, stats)`.
- **London Dispersion Forces** (`page: 'imf-lab'`, no particle keys): `sets` of molecules, each `{ id, name, formula, axis, bp, mp, mr, dHvap, forces, electrons, structure, arrangement, note }`. `structure` is a displayed formula in C–C bond units (`atoms`, `bonds`, `lonePairs`, `charges` for permanent δ, `hDonor`/`hAcceptor`); `arrangement` (`dx`, `mirror`, `flipY`) places the second molecule against the first. Electrons are generated from the structure; `electrons` is the expected count, checked against it.
- **Maxwell–Boltzmann Distribution** (`page: 'mb-lab'`, no particle keys): `particles` (sample size), `temperature` (K) and `activationEnergy` (kJ mol⁻¹) as `{ min, max, step, default }`, `catalystFactor` (Ea with catalyst = factor × Ea), `graph` (`maxEnergy`, `binWidth` per dot column, `maxCount` dots on the y-axis). Annotation `text` may be a function of `(vars, stats)`.

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

Every simulation appears on the front page under its year groups; there is no on/off list. The top bar's "Copy link" copies `?reaction=<id>`, which opens the front page with that simulation selected (teachers paste it into ManageBac).

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
- **The pH lab calculates pH exactly**, not from particles: the charge balance with Ka, Kb and Kw is solved for [H⁺], so dilution (strong acid +1 per 10×, weak acid +0.5), neutralisation, buffers and titration curves come out as in a real lab. Temperature changes only Kw (neutral pH 6.51 at 60 °C).
- **London forces are shown, not computed:** the molecules lie one above the other, so the top molecule's electrons shift up or down, towards or away from the other (a temporary dipole), by an amount that varies along it as a sum of slowly varying random waves. The lower molecule's electrons are pushed the same way (an induced dipole), so the facing sides are always δ− opposite δ+. Small molecules shift as a whole; longer ones get several patches at once and more contact. Inner-shell electrons barely move; halogen outer electrons move more down the group. The attraction meter is scaled so its average equals the real ΔHvap, and the pair separates above the real boiling point. The lower molecule can be turned (0–90°): its induced dipole fades along it away from the end that touches, and the meter's average is kept for side by side, so turned pairs show less attraction.
- **Maxwell–Boltzmann:** particle energies follow the 3D distribution (the textbook curve), although the box is flat. A collision shares the pair's total energy out again in the proportions of a real gas, so energy is conserved, single particles keep changing energy and the sample keeps the distribution. Heating scales every energy. Activation energies are lower than real ones (50–100 kJ mol⁻¹) so that particles above Ea are visible in a sample of 200; the page says so.
- **Simulations open paused** so students can read the opening annotation first.
- **No accounts, names or saved data.** The quiz shows the score and the correct answers and stores nothing. The teacher panel (PIN, on/off list, quiz results, notes) was removed: it saved everything in one browser only, so it never reached students' laptops.

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
The repo is configured to serve from the `docs/` folder on the `main` branch. Commit the source changes together with `docs/`. `dist/` is only local build output and is git-ignored.

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
- **Planned, not started:** standalone equilibrium.

## Important Notes for AI Developers

1. **Read the scenario config files** before modifying simulation behaviour — they are the source of truth for how each simulation works.
2. **Test on the dev server** (`npm run dev`) before committing — the simulation runs at 60fps and bugs are immediately visible.
3. **Don't add unnecessary dependencies.** This runs on school laptops with spotty internet. Keep the bundle small.
4. **The `docs/` folder is the deployed site.** Always rebuild and copy to `docs/` when committing changes.
5. **Nothing is stored.** No backend, no database, no accounts, no localStorage.
6. **Check `useSimulation.js`** for the main simulation loop — this is where physics, collisions, and reactions happen each frame.
7. **Commit and push only when the teacher asks.** They say "commit" and "push" explicitly and check the result on the live site.
8. **Measuring behaviour** (e.g. how long salt takes to dissolve): a hidden browser tab or pane throttles the animation, so real-time timing is unreliable. Instead, from the browser console, find the `GameLoop` through the canvas element's React fiber (`__reactFiber$…` → hook refs), set `loop.paused = true`, and call `loop.updateFn(1/60, loop.elapsed += 1/60)` in a loop. Single runs vary, so average several. The pH lab's chemistry (`src/engine/phLab.js`) is pure functions: check it directly in Node against textbook values. For the IMF lab, bundle the module with `node_modules/.bin/esbuild --bundle --format=esm` and check every molecule's built electron count (`buildMolecule(structure).electrons.length`) against its `electrons` value. The Maxwell–Boltzmann engine (`src/engine/maxwellBoltzmann.js`) can be bundled the same way: check the curve's area (1), `fractionAbove` against numeric integration, and that a sample run for a while keeps the same share above Ea.
