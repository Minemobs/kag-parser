import Encoding from "encoding-japanese";

type MultilineMacro = { type: string, args?: Map<string, string>, innerContent: CommandExec }; // For @if/@else
type Macro = Omit<MultilineMacro, "innerContent">;
type CommandExec = Array<Macro | MultilineMacro | string>;
type Command = { commands: string[], exec: CommandExec };
type RawScenario = { file: string, init: CommandExec, commands: Command[] };

function debug(str: string, ...params: any) {
  if(process.env["DEBUG"] !== undefined) console.log(`[DEBUG]: ${str}`, params);
}

function decode(buffer: ArrayBuffer, from: Encoding.Encoding = "SJIS") {
  return Encoding.codeToString(Encoding.convert(new Uint8Array(buffer), {
    from,
    to: "UNICODE",
    fallback: "error"
  }));
}

function encode(str: string, to: Encoding.Encoding = "SJIS") {
  return Buffer.from(Encoding.convert(Encoding.stringToCode(str), {
    from: "UNICODE",
    to,
    fallback: "error"
  }));
}

function getMacroType(line: string) {
  const firstSpace = line.indexOf(" ");
  return line.substring(1, firstSpace === -1 ? undefined : firstSpace);
}

function parseIf(
  lines: readonly string[],
  startIndex: number,
): [number, MultilineMacro] {
  const firstLine = lines[startIndex - 1]!.trim();
  const firstSpace = firstLine.indexOf(" ");
  const firstLineType = getMacroType(firstLine) as "if" | "else";

  const args = firstLineType === "if"
    ? parseArguments(firstLine.substring(firstSpace + 1))
    : undefined;
  const innerContent: CommandExec = [];

  let i = startIndex;

  for (; i < lines.length; i++) {
    const line = lines[i]!.trim();
    const type = getMacroType(line);
    if (type === "if" || line === "else") {
      const [offset, innerMacro] = parseIf(lines, i + 1);
      innerContent.push(innerMacro);
      i = offset - 1;
      continue;
    }

    if (line.startsWith("@endif")) {
      break;
    }
    const [offset, commands] = parseCommand(lines.slice(i), "endif");
    innerContent.push(...commands);
    i += offset;
    break;
  }
  return [i, { type: firstLineType, args, innerContent: innerContent }];
}

function parseArguments(line: string): Map<string, string> {
  const params = new Map<string, string>();
  const defaultValues = ["", "", false, false] as [string, string, boolean, boolean];
  let [key, value, foundEqualSign, insideString] = defaultValues;
  for (const char of line) {
    if (char == '"') {
      if (!insideString) {
        insideString = true;
        continue;
      }
      insideString = false;
      params.set(key.trim(), value);
      [key, value, foundEqualSign, insideString] = defaultValues;
      continue;
    }
    if (!foundEqualSign && char == "=") {
      foundEqualSign = true;
      continue;
    }
    if (foundEqualSign) {
      value += char;
      continue;
    }
    key += char;
  }
  const lastKey = key.trim();
  if (lastKey.length !== 0) params.set(lastKey, value);
  return params;
}

function parseCommand(exec: readonly string[], stopAtMacro?: string): [number, CommandExec] {
  const arr: CommandExec = [];
  let i = 0;
  for (; i < exec.length; i++) {
    const line = exec[i]!.trim();
    if (line.length === 0) continue;
    if (!line.startsWith("@")) {
      arr.push(line);
      continue;
    }
    const firstSpace = line.indexOf(" ");
    const type = getMacroType(line);
    debug("Macro:", type);
    if (firstSpace === -1 && type !== "else") {
      if (stopAtMacro === type) break;
      arr.push({ type });
      continue;
    }

    if (type === "if" || type === "else") {
      const [offset, macro] = parseIf(exec, i + 1);
      arr.push(macro);
      i = offset;
      continue;
    }

    if (stopAtMacro === type) break;
    const args = parseArguments(line.substring(firstSpace + 1));
    arr.push({ type, args });
  }
  return [i, arr];
}


function readFile(encodedBuffer: ArrayBuffer): RawScenario {
  const file = decode(encodedBuffer).split("\n").filter(it => !it.trim().startsWith(";"));

  const commands: Command[] = [];
  let initContent = "";
  let currentCommand: string[] = [];
  let commandExec: string[] = [];

  for (const currentLine of file) {
    if (currentLine.length === 0) continue;
    const line = currentLine.trim();
    const commandDeclaration = line.startsWith("*");
    if (!commandDeclaration) {
      if (currentCommand.length === 0) {
        initContent += line + "\n";
        continue;
      }
      commandExec.push(line);
      continue;
    }

    if (commandExec.length !== 0) {
      commands.push({ commands: currentCommand, exec: parseCommand(commandExec)[1] });
      currentCommand = [];
      commandExec = [];
    }
    currentCommand.push(line.substring(1));
  }
  commands.push({ commands: currentCommand, exec: parseCommand(commandExec)[1] });
  // return file.join();
  return {
    file: process.env["DEBUG"] === undefined ? "" : file.join("\n"),
    init: parseCommand(initContent.split("\n"))[1],
    commands
  };
}

async function readScenario(id: string) {
  return readFile(await Bun.file(`game_files/scenario/sg${id}.txt`).arrayBuffer());
}

const scenario = await readScenario("1-1a");
// console.log(Bun.inspect(scenario, { depth: 10000, compact: false, colors: true }));
console.log(JSON.stringify(scenario));
