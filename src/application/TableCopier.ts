import { DataviewBlock, DataviewBlocks } from "../domain/DataviewBlocks";

export type Rendering = { ok: true; markdown: string } | { ok: false; error: string };

export interface QueryRenderer {
	render(query: string, notePath: string): Promise<Rendering>;
}

export interface Clipboard {
	write(text: string): Promise<void>;
}

export type CopyOutcome =
	| { kind: "copied" }
	| { kind: "no-block" }
	| { kind: "query-failed"; error: string };

export class TableCopier {
	constructor(
		private readonly renderer: QueryRenderer,
		private readonly clipboard: Clipboard,
	) {}

	copyFirst(noteText: string, notePath: string): Promise<CopyOutcome> {
		return this.copy(DataviewBlocks.in(noteText).first(), notePath);
	}

	copyAt(noteText: string, offset: number, notePath: string): Promise<CopyOutcome> {
		return this.copy(DataviewBlocks.in(noteText).at(offset), notePath);
	}

	private async copy(block: DataviewBlock | undefined, notePath: string): Promise<CopyOutcome> {
		if (!block) return { kind: "no-block" };
		const rendering = await this.renderer.render(block.query, notePath);
		if (!rendering.ok) return { kind: "query-failed", error: rendering.error };
		await this.clipboard.write(rendering.markdown.trim());
		return { kind: "copied" };
	}
}
