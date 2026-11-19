import type { App } from "obsidian";
import type { QueryRenderer, Rendering } from "../application/TableCopier";

type DataviewResult = { successful: true; value: string } | { successful: false; error: string };

interface DataviewApi {
	queryMarkdown(source: string, originFile?: string): Promise<DataviewResult>;
}

interface AppWithPlugins {
	plugins: { plugins: Record<string, { api?: DataviewApi } | undefined> };
}

export class DataviewQueryRenderer implements QueryRenderer {
	constructor(private readonly app: App) {}

	async render(query: string, notePath: string): Promise<Rendering> {
		const api = (this.app as unknown as AppWithPlugins).plugins.plugins.dataview?.api;
		if (!api) return { ok: false, error: "Dataview is not enabled" };
		const result = await api.queryMarkdown(query, notePath);
		return result.successful ? { ok: true, markdown: result.value } : { ok: false, error: String(result.error) };
	}
}
