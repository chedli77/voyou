/**
 * Note un texte en ligne de commande, pour tester une règle rapidement.
 * Usage : npm run score -- "sale arabe rentre chez toi"
 */
import { scoreText } from "../extension/detection/score.js";

const text = process.argv.slice(2).join(" ");
if (!text) {
  console.error('Usage : npm run score -- "texte à tester"');
  process.exit(1);
}
console.log(JSON.stringify(scoreText({ text }), null, 2));
