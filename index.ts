type Line = Command | string | Macro;

interface Command {
  names: string[];
  inner: Line[];
}

interface Macro {
  name: string;
  arguments: Map<string, string> | undefined;
};

interface MultilineMacro extends Macro {
  inner: Line[];
};

interface IfMacro extends MultilineMacro {
  condition: string; // Includes the else in it
};

interface ElseMacro extends MultilineMacro {
  ifRef: IfMacro;
}

const SHIFT_JIS_DECODER = new TextDecoder("shift_jis" as Bun.Encoding);
const ARGUMENTS_PATTERN = /(?<paramName>\w+)=(?<value>".*"|[^\s]+)\s?/gm;

function openScenarioFile(fileName: string) {
  return Bun.file(`./SGVSO-Data/scenario/${fileName}.txt`).arrayBuffer().then(it => SHIFT_JIS_DECODER.decode(it).split("\n"));
}

export function splitMacroArguments(line: string): Map<string, string> {
  const args = new Map<string, string>();
  for(const [_, key, value] of line.matchAll(ARGUMENTS_PATTERN)) {
    args.set(key!, value![0] === '"' ? value!.substring(1, value!.length - 1) : value!);
  }
  return args;
}

function parseIfElse(lines: string[]): [number, IfMacro] {
  const rawMacro = lines[0];
  for(let i = 1; i < lines.length; i++) {
    
  }
}
