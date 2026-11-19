export class DataviewBlock {
	constructor(
		readonly query: string,
		readonly from: number,
		readonly to: number,
	) {}

	contains(offset: number): boolean {
		return this.from <= offset && offset <= this.to;
	}
}

export class DataviewBlocks {
	private static readonly FENCE = /^```dataview[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gm;

	private constructor(private readonly blocks: readonly DataviewBlock[]) {}

	static in(text: string): DataviewBlocks {
		const blocks = [...text.matchAll(DataviewBlocks.FENCE)].map(
			(match) => new DataviewBlock(match[1], match.index, match.index + match[0].length),
		);
		return new DataviewBlocks(blocks);
	}

	first(): DataviewBlock | undefined {
		return this.blocks[0];
	}

	at(offset: number): DataviewBlock | undefined {
		return this.blocks.find((block) => block.contains(offset));
	}
}
