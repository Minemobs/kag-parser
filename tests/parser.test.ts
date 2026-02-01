// @position layer=message1 page=fore color=0 opacity=255 frame="" visible=true left=0 top=0 width=&kag.scWidth height=&kag.scHeight marginL=0

import { expect, test } from "bun:test";
import { parseMacroArguments } from "../src/parser";

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
