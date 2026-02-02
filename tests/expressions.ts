import type { Command, ElseMacro, IfMacro, Line, Macro } from "../src/types";

export class ExpressionBuilder {
  expressions: Line[];

  constructor() {
    this.expressions = [];
  }

  set(name: string, value: string): this {
    this.expressions.push({ name: "set", arguments: { name, value }});
    return this;
  }

  ifNoElse(condition: string, expr: ExpressionBuilder): this {
    this.expressions.push(
      { name: "if", condition, inner: expr.expressions } as IfMacro,
      { name: "endif", arguments: undefined }
    )
    return this;
  }

  ifElse(condition: string, ifExpr: ExpressionBuilder, elseExpr: ExpressionBuilder): this {
    const elseMacro: ElseMacro = { name: "else", arguments: undefined, inner: elseExpr.expressions };
    this.expressions.push(
      { name: "if", condition, elseMacro, inner: ifExpr.expressions } as IfMacro,
      { name: "endif", arguments: undefined }
    );
    return this;
  }

  input(): this {
    this.expressions.push({ name: "input", arguments: undefined });
    return this;
  }

  createCommand(command: CommandBuilder) {
    this.expressions.push(command.build());
    return this;
  }

  toJSON() {
    return JSON.stringify(this.expressions);
  }
}

export class CommandBuilder extends ExpressionBuilder {
  names: string[];

  constructor(names: string[]) {
    super();
    this.names = names;
  }

  build(): Command {
    return { names: this.names, inner: this.expressions };
  }

  override createCommand(command: CommandBuilder): never {
    throw Error(`Cannot create a command inside '${this.names.toString()}'`);
  }

  override toJSON() {
    return JSON.stringify(this.build());
  }
}

// console.log(new ExpressionBuilder().set("message", "Hello World").toJSON());
console.log(new CommandBuilder(["phone", "p"])
  .ifElse("tf.phone == 0",
    new ExpressionBuilder().set("tf.phone", "1"),
    new ExpressionBuilder().input()
  )
  .set("Hello", "World")
  .toJSON());
