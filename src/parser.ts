import { ARGUMENTS_PATTERN } from "./consts";
import type { Command, ElseMacro, IfMacro, Line, Macro, Macros } from "./types";

// Commands:

export function parseCommand(lines: string[]): [number, Command] {
  const names: string[] = [];
  const inner: Line[] = [];

  let readingNames = true;
  let i = 0;

  for (; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (line.length === 0) continue;
    const firstChar = line[0];
    if (firstChar === ";") continue;

    if (readingNames) {
      if (firstChar === "*") {
        names.push(line.substring(1));
        continue;
      }
      readingNames = false;
    } else if (!readingNames && firstChar === "*") {
      return [i - 2, { names, inner }];
    }
    if (firstChar === "@") {
      const [offset, macro] = parseMacro(lines.slice(i));
      i += offset;
      inner.push(macro);
    } else if (false) { // if fileext == ".ks" && line[0] == '['

    } else {
      inner.push(line);
    }
  }
  return [i - 1, { names, inner }];
}

// Macros:

export function parseMacroArguments(line: string): Record<string, string> {
  const args = new Map<string, string>();
  for (const [_, key, value] of line.matchAll(ARGUMENTS_PATTERN)) {
    args.set(key!, value![0] === '"' ? value!.substring(1, value!.length - 1) : value!);
  }
  return Object.fromEntries(args);
}

export function parseMacro(lines: string[]): [number, Macro] {
  const firstLine = lines[0]!.trim();
  const macroName = firstLine.split(" ")[0]!.substring(1);

  let macro: Macro = { name: macroName };
  let offset = 1;

  switch (macroName as Macros) {
    //Multiline macros:
    case "if":
      const [_offset, _macro] = parseIfElse(lines);
      offset += _offset;
      macro = _macro;
      break;

    //One line macro with arguments
    case "set":
    case "play":
    case "draw":
    case "goto":
      macro.arguments = parseMacroArguments(firstLine);
      break;

    //Shouldn't be parsed
    case "else":
    case "endif":
      // throw Error(`Macro "${macroName}" shouldn't be parsed by "parseMacro".`);
      console.warn(`[WARN]: Macro "${macroName}" shouldn't be parsed by "parseMacro".`);
      console.warn("\tStarts with: '%s'\n\t%s\n", lines[0]?.trim() ?? "", lines[1]?.trim() ?? "");
      break;

    // Specific cases
    case "chse":
      macro.arguments = { status: firstLine.split(" ")[1]!};
      break;
    
    //One line macro w/o arguments or unknown macro
    case "input":
    case "stop":
    case "clear":
    case "gameover":
      break;
    default:
      macro.arguments = parseMacroArguments(firstLine);
      if(Bun.env["IGNORE_UNKNOWN_MACRO"] === undefined)
        console.warn(`Unknown macro: ${macroName}`);
      break;
  }
  return [offset - 1, macro];
}

export function parseIfElse(lines: string[]): [number, IfMacro | ElseMacro] {
  //TODO: nested ifs
  const rawMacro = lines[0]!.trim();
  const name = rawMacro.split(" ")[0]!.substring(1) as "if" | "else";
  const args = parseMacroArguments(rawMacro);
  let i = 1;
  const inner: Line[] = [];
  let elseMacro: ElseMacro | undefined;
  for (; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if(line.length === 0) continue;
    if(line.startsWith("@else")) {
      const [offset, _elseMacro] = parseIfElse(lines.slice(i));
      elseMacro = _elseMacro;
      i += offset + 1;
      break;
    }
    if(line.startsWith("@endif")) {
      i += 1;
      break;
    }
    switch(line[0]) {
      case '@': {
        const [offset, macro] = parseMacro(lines.slice(i));
        inner.push(macro);
        i += offset;
        break;
      }
      case '*': {
        const [offset, command] = parseCommand(lines.slice(i));
        inner.push(command);
        i += offset;
        break;
      }
      default:
        inner.push(line);
        break;
    }
  }
  switch(name) {
    case "else":
      return [i - 1, {
        name: "else",
        inner,
      } as ElseMacro];
    case "if":
      return [i - 1, {
        name: "if",
        inner,
        arguments: args,
        condition: args["exp"],
        elseMacro: elseMacro,
      } as IfMacro];
    default:
      throw Error(`Unknown name '${name}'`);
  }
}
