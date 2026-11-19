import { MarkdownView, Notice, Plugin } from "obsidian";
import type { EditorView } from "@codemirror/view";
import { CopyOutcome, TableCopier } from "./application/TableCopier";
import { CopyButtons } from "./infrastructure/CopyButtons";
import { DataviewQueryRenderer } from "./infrastructure/DataviewQueryRenderer";
import { NavigatorClipboard } from "./infrastructure/NavigatorClipboard";

export default class CopyDataviewTablePlugin extends Plugin {
	private copier!: TableCopier;
	private buttons!: CopyButtons;

	override onload(): void {
		this.copier = new TableCopier(new DataviewQueryRenderer(this.app), new NavigatorClipboard());
		this.buttons = new CopyButtons((block) => this.copyBlock(block));

		this.addCommand({
			id: "copy-first-table",
			name: "Copy first Dataview table in note",
			checkCallback: (checking) => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!view?.file) return false;
				if (!checking) void this.copyFirst(view);
				return true;
			},
		});

		this.app.workspace.onLayoutReady(() => this.buttons.watch(document));
		this.registerEvent(this.app.workspace.on("window-open", (win) => this.buttons.watch(win.doc)));
	}

	override onunload(): void {
		this.buttons.dispose();
	}

	private async copyFirst(view: MarkdownView): Promise<void> {
		const outcome = await this.copier.copyFirst(view.getViewData(), view.file!.path);
		this.report(outcome);
	}

	private async copyBlock(block: HTMLElement): Promise<boolean> {
		const view = this.viewContaining(block);
		const editor = (view?.editor as unknown as { cm?: EditorView } | undefined)?.cm;
		if (!view?.file || !editor) return false;
		const outcome = await this.copier.copyAt(view.getViewData(), editor.posAtDOM(block), view.file.path);
		return this.report(outcome);
	}

	private viewContaining(element: HTMLElement): MarkdownView | undefined {
		let found: MarkdownView | undefined;
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.view instanceof MarkdownView && leaf.view.containerEl.contains(element)) found = leaf.view;
		});
		return found;
	}

	private report(outcome: CopyOutcome): boolean {
		switch (outcome.kind) {
			case "copied":
				new Notice("Table copied");
				return true;
			case "no-block":
				new Notice("No Dataview table in this note");
				return false;
			case "query-failed":
				new Notice(`Dataview query failed: ${outcome.error}`);
				return false;
		}
	}
}
