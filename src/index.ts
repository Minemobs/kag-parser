import { SHIFT_JIS_DECODER } from "./consts";
import { parseCommand, parseMacro } from "./paarser";
import type { Line } from "./types";

function openScenarioFile(fileName: string) {
  return Bun.file(`./SGVSO-Data/scenario/${fileName}.txt`).arrayBuffer()
    .then(it => SHIFT_JIS_DECODER.decode(it).split("\n"));
}

const _lines = await openScenarioFile("sg1-1a");
for (let i = 0; i < _lines.length; i++) {
  const outputLines: Line[] = [];

  const line = _lines[i]!.trim();
  if (line.length === 0) continue;
  const firstChar = line[0]!;

  switch (firstChar) {
    case '@':
      const macros = parseMacro(_lines.slice(i));
      console.log(`Found Macro: ${JSON.stringify(macros)}`);
      i += macros[0];
      break;
    case '*':
      // console.debug(`[DEBUG]: ${JSON.stringify(_lines.slice(i - 1))}` + "\n");
      const cmd = parseCommand(_lines.slice(i - 1));
      i += cmd[0];
      console.log("\n" + `Found Command: ${JSON.stringify(cmd[1])}` + "\n");
      break;
  }
}
