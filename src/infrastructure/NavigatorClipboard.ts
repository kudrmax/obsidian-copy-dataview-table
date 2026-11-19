import type { Clipboard } from "../application/TableCopier";

export class NavigatorClipboard implements Clipboard {
	write(text: string): Promise<void> {
		return navigator.clipboard.writeText(text);
	}
}
