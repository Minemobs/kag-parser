export type Line = Command | string | Macro;

export interface Command {
  names: string[];
  inner: Line[];
}

export interface Macro {
  name: string;
  arguments?: Record<string, string>;
};

export interface MultilineMacro extends Macro {
  inner: Line[];
};

export interface IfMacro extends MultilineMacro {
  condition: string;
  elseMacro: ElseMacro | undefined;
};

export interface ElseMacro extends MultilineMacro {}

export type Macros = "if" | "set" | "play" | "input" | "draw" | "else" | "endif" | "stop" | "clear" | "gameover" | "goto" | "chse";
