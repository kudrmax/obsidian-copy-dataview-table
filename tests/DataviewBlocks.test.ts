import { describe, expect, it } from "vitest";
import { DataviewBlocks } from "../src/domain/DataviewBlocks";

const note = [
	"# Note",
	"```dataviewjs",
	"dv.table([], [])",
	"```",
	"```dataview",
	"TABLE a FROM #first",
	"```",
	"text",
	"```dataview",
	"LIST FROM #second",
	"```",
].join("\n");

describe("DataviewBlocks", () => {
	it("takes the first dataview block, skipping dataviewjs", () => {
		expect(DataviewBlocks.in(note).first()?.query).toBe("TABLE a FROM #first\n");
	});

	it("finds the block that holds an offset", () => {
		const offset = note.indexOf("```dataview\nLIST");
		expect(DataviewBlocks.in(note).at(offset)?.query).toBe("LIST FROM #second\n");
	});

	it("finds nothing outside the blocks", () => {
		expect(DataviewBlocks.in(note).at(note.indexOf("text"))).toBeUndefined();
		expect(DataviewBlocks.in("plain").first()).toBeUndefined();
	});
});
