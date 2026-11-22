// Ember Duel — the hand-in program.
// Copies game/ and screenshots/ from this repository to the output directory
// and writes dossier.json there with buildDossier from vendor/makefun-game.ts.
// The grader runs this twice; both runs must write the same bytes.
import { cpSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const here = dirname(fileURLToPath(import.meta.url));

mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'game'), join(outDir, 'game'), { recursive: true });
cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

// A short, deterministic summary on stdout: what was handed in.
const shotCount = readdirSync(join(outDir, 'screenshots')).filter((f) => !f.startsWith('.')).length;
console.log(`Ember Duel: game/ + ${shotCount} screenshots + dossier.json (${dossier.length} bytes) -> ${outDir}`);
