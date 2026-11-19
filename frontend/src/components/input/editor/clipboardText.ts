import type {Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

const LIST_NODES = new Set(['bulletList', 'orderedList', 'taskList'])

function listItemPrefix(list: ProseMirrorNode, item: ProseMirrorNode, index: number): string {
	switch (list.type.name) {
		case 'orderedList':
			return `${index + 1}. `
		case 'taskList':
			return item.attrs.checked ? '- [x] ' : '- [ ] '
		default:
			return '- '
	}
}

function nodeLines(node: ProseMirrorNode): string[] {
	if (LIST_NODES.has(node.type.name)) {
		const lines: string[] = []
		node.forEach((item, _offset, index) => {
			const prefix = listItemPrefix(node, item, index)
			const itemLines: string[] = []
			item.forEach(child => itemLines.push(...nodeLines(child)))
			itemLines.forEach((line, lineIndex) => {
				// Continuation lines of a multi-line item are indented under its marker.
				lines.push(lineIndex === 0 ? prefix + line : '  ' + line)
			})
			if (itemLines.length === 0) {
				lines.push(prefix.trimEnd())
			}
		})
		return lines
	}

	if (node.isTextblock) {
		return [node.textContent]
	}

	if (node.isLeaf) {
		return []
	}

	const lines: string[] = []
	node.forEach(child => lines.push(...nodeLines(child)))
	return lines
}

/**
 * Plain text for the clipboard that keeps list markers, so a copied bullet list
 * still reads as a list outside the editor. ProseMirror's default drops them.
 */
export function serializeSliceAsText(slice: Slice): string {
	const lines: string[] = []
	slice.content.forEach(node => lines.push(...nodeLines(node)))
	return lines.join('\n')
}
