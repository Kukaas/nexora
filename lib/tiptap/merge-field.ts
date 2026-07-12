import { Node, mergeAttributes } from "@tiptap/core";

/**
 * A Tiptap inline "merge field" — the placeholder the secretary drops into a
 * document layout (e.g. `{{Full name}}`, `{{Reference number}}`). It's an atom
 * (a single, non-editable token) that serializes to a tagged span:
 *
 *   <span data-merge="field"  data-key="Full name">Full name</span>
 *   <span data-merge="system" data-key="referenceNumber">Reference number</span>
 *
 * `kind` is "field" (a resident custom field, keyed by its label) or "system"
 * (a built-in token from MERGE_SYSTEM_TOKENS, keyed by its stable key). At print
 * time the merge view swaps each span for the request's resolved value; in the
 * editor the `.nx-merge` class renders it as a highlighted chip.
 */

export type MergeFieldKind = "field" | "system";

export interface MergeFieldAttrs {
  kind: MergeFieldKind;
  key: string;
  label: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mergeField: {
      /** Insert a merge-field placeholder at the current selection. */
      insertMergeField: (attrs: MergeFieldAttrs) => ReturnType;
    };
  }
}

export const MergeField = Node.create({
  name: "mergeField",
  inline: true,
  group: "inline",
  atom: true,
  selectable: true,
  // In-flow text token; dragging it around is more confusing than helpful.
  draggable: false,

  addAttributes() {
    return {
      kind: {
        default: "field",
        parseHTML: (el) => el.getAttribute("data-merge") ?? "field",
        renderHTML: (attrs) => ({ "data-merge": attrs.kind }),
      },
      key: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-key") ?? "",
        renderHTML: (attrs) => ({ "data-key": attrs.key }),
      },
      // The visible label. Not emitted as its own attribute — it's the span's
      // text content (see renderHTML), and read back from there on parse.
      label: {
        default: "",
        parseHTML: (el) => el.textContent ?? "",
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-merge]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { class: "nx-merge" }),
      node.attrs.label || node.attrs.key || "",
    ];
  },

  renderText({ node }) {
    return node.attrs.label || node.attrs.key || "";
  },

  addCommands() {
    return {
      insertMergeField:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});
