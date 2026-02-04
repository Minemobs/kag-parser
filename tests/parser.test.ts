// @position layer=message1 page=fore color=0 opacity=255 frame="" visible=true left=0 top=0 width=&kag.scWidth height=&kag.scHeight marginL=0

import { describe, expect, test } from "bun:test";
import { parseMacro, parseMacroArguments } from "../src/parser";
import { ExpressionBuilder, CommandBuilder } from "./expressions";
import type { Macro } from "../src/types";

test("parse position macro arguments", () => {
  const args = parseMacroArguments(`@position layer=message1 page=fore color=0 opacity=255 frame="" visible=true left=0 top=0 width=&kag.scWidth height=&kag.scHeight marginL=0`);
  expect(args)
    .toStrictEqual({
      layer: "message1",
      page: "fore",
      color: "0",
      opacity: "255",
      frame: "",
      visible: "true",
      left: "0",
      top: "0",
      width: "&kag.scWidth",
      height: "&kag.scHeight",
      marginL: "0",
    })
});

describe("Basic parsing test", () => {
  test("Parse set macro", () => {
    expect(parseMacro([`@set name="hello" value="world"`])[1]!).toEqual(
      new ExpressionBuilder().set("hello", "world").expressions[0]! as Macro
    );
  });
  test("Parse if else", () => {
    const rawText = `
      @if exp="pos == 0"
        @set name="pos" value="1"
      @else
        @input
      @endif
    `.trim().split("\n");
    expect(parseMacro(rawText)[1]!).toStrictEqual(
      new ExpressionBuilder()
        .ifElse("pos == 0",
          new ExpressionBuilder().set("pos", "1"),
          new ExpressionBuilder().input()
        )
        .expressions[0]! as Macro
    );
  });
  test("Parse nested if else", () => {
    const rawText = `
      @if exp="pos == 0"
        @if exp="level == 1"
          @set name="level" value="3"
        @else
          @set name="level" value="1"
        @endif
        @set name="pos" value="1"
      @else
        @input
      @endif
    `.trim().split("\n");
    expect(parseMacro(rawText)[1]!).toStrictEqual(
      new ExpressionBuilder()
        .ifElse("pos == 0",
          new ExpressionBuilder()
            .ifElse("level == 1",
              new ExpressionBuilder().set("level", "3"),
              new ExpressionBuilder().set("level", "1")
            )
            .set("pos", "1"),
          new ExpressionBuilder().input()
        )
        .expressions[0]! as Macro);
  });
});
