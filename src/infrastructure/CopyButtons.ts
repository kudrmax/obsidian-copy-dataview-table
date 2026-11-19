import { setIcon } from "obsidian";

export type CopyRequest = (block: HTMLElement) => Promise<boolean>;

export class CopyButtons {
	static readonly BUTTON_CLASS = "copy-dataview-table-button";
	private static readonly BLOCK = ".cm-embed-block";
	private static readonly DATAVIEW = ".block-language-dataview";
	private static readonly ACTIONS = ".embed-actions";
	private static readonly EDIT_BUTTON = ".edit-block-button";
	private static readonly CONFIRMATION_MS = 1500;

	private readonly observers: MutationObserver[] = [];
	private scheduled = false;

	constructor(private readonly onCopy: CopyRequest) {}

	watch(doc: Document): void {
		const observer = new MutationObserver(() => this.scheduleScan(doc));
		observer.observe(doc.body, { childList: true, subtree: true });
		this.observers.push(observer);
		this.scan(doc);
	}

	dispose(): void {
		this.observers.forEach((observer) => observer.disconnect());
		this.observers.length = 0;
		activeDocument.querySelectorAll(`.${CopyButtons.BUTTON_CLASS}`).forEach((button) => button.remove());
	}

	private scheduleScan(doc: Document): void {
		if (this.scheduled) return;
		this.scheduled = true;
		doc.defaultView?.requestAnimationFrame(() => {
			this.scheduled = false;
			this.scan(doc);
		});
	}

	private scan(doc: Document): void {
		doc.querySelectorAll<HTMLElement>(CopyButtons.BLOCK).forEach((block) => {
			if (!block.querySelector(`:scope > ${CopyButtons.DATAVIEW}`)) return;
			const actions = block.querySelector(`:scope > ${CopyButtons.ACTIONS}`);
			if (!actions || actions.querySelector(`.${CopyButtons.BUTTON_CLASS}`)) return;
			const editButton = actions.querySelector(`:scope > ${CopyButtons.EDIT_BUTTON}`);
			if (!editButton) return;
			actions.insertBefore(this.createButton(block), editButton);
		});
	}

	private createButton(block: HTMLElement): HTMLElement {
		const button = block.doc.createElement("div");
		button.addClasses(["embed-action", CopyButtons.BUTTON_CLASS]);
		button.setAttribute("aria-label", "Copy table");
		setIcon(button, "copy");
		button.addEventListener("mousedown", (event) => event.stopPropagation());
		button.addEventListener("click", async (event) => {
			event.preventDefault();
			event.stopPropagation();
			if (await this.onCopy(block)) this.confirm(button);
		});
		return button;
	}

	private confirm(button: HTMLElement): void {
		setIcon(button, "check");
		button.win.setTimeout(() => setIcon(button, "copy"), CopyButtons.CONFIRMATION_MS);
	}
}
