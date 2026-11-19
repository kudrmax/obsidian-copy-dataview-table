import { describe, expect, it } from "vitest";
import { Clipboard, QueryRenderer, Rendering, TableCopier } from "../src/application/TableCopier";

class FakeClipboard implements Clipboard {
	text: string | undefined;
	async write(text: string): Promise<void> {
		this.text = text;
	}
}

class FakeRenderer implements QueryRenderer {
	readonly calls: Array<[string, string]> = [];
	constructor(private readonly rendering: Rendering) {}
	async render(query: string, notePath: string): Promise<Rendering> {
		this.calls.push([query, notePath]);
		return this.rendering;
	}
}

const note = "```dataview\nTABLE a\n```\n\n```dataview\nTABLE b\n```";

describe("TableCopier", () => {
	it("copies the first table of the note", async () => {
		const renderer = new FakeRenderer({ ok: true, markdown: "| a |\n| - |\n\n" });
		const clipboard = new FakeClipboard();
		const outcome = await new TableCopier(renderer, clipboard).copyFirst(note, "Note.md");
		expect(outcome).toEqual({ kind: "copied" });
		expect(renderer.calls).toEqual([["TABLE a\n", "Note.md"]]);
		expect(clipboard.text).toBe("| a |\n| - |");
	});

	it("copies the table at the clicked block", async () => {
		const renderer = new FakeRenderer({ ok: true, markdown: "| b |" });
		await new TableCopier(renderer, new FakeClipboard()).copyAt(note, note.lastIndexOf("```dataview"), "Note.md");
		expect(renderer.calls[0][0]).toBe("TABLE b\n");
	});

	it("reports a note without tables and leaves the clipboard alone", async () => {
		const clipboard = new FakeClipboard();
		const outcome = await new TableCopier(new FakeRenderer({ ok: true, markdown: "" }), clipboard).copyFirst("text", "Note.md");
		expect(outcome).toEqual({ kind: "no-block" });
		expect(clipboard.text).toBeUndefined();
	});

	it("reports a failed query", async () => {
		const clipboard = new FakeClipboard();
		const outcome = await new TableCopier(new FakeRenderer({ ok: false, error: "bad" }), clipboard).copyFirst(note, "Note.md");
		expect(outcome).toEqual({ kind: "query-failed", error: "bad" });
		expect(clipboard.text).toBeUndefined();
	});
});
