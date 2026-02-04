import { SHIFT_JIS_DECODER } from "./consts";
import { parseCommand, parseMacro } from "./parser";
import type { Line } from "./types";

function openScenarioFile(fileName: string) {
  return Bun.file(`./SGVSO-Data/scenario/${fileName}`).arrayBuffer()
    .then(it => SHIFT_JIS_DECODER.decode(it).split("\n"));
}

async function parseFile() {
  const _lines = await openScenarioFile(Bun.argv[2] ?? "sg1-1a.txt");
  const outputLines: Line[] = [];
  for (let i = 0; i < _lines.length; i++) {

    const line = _lines[i]!.trim();
    if (line.length === 0) continue;
    const firstChar = line[0]!;

    switch (firstChar) {
      case '@':
        const macros = parseMacro(_lines.slice(i));
        // console.log(`Found Macro: ${JSON.stringify(macros)}`);
        i += macros[0];
        outputLines.push(macros[1]);
        break;
      case '*':
        // console.debug(`[DEBUG]: ${JSON.stringify(_lines.slice(i - 1))}` + "\n");
        const cmd = parseCommand(_lines.slice(i - 1));
        i += cmd[0];
        outputLines.push(cmd[1]);
        // console.log("\n" + `Found Command: ${JSON.stringify(cmd[1])}` + "\n");
        break;
      case "[":
        throw new Error("Macro definition aren't supported");
      case ';':
        // Ignore comments
        break;
      default:
        outputLines.push(line);
        break;
    }
  }
  console.log(outputLines);
}

parseFile();
