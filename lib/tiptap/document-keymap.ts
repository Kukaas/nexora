import { Extension } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";

/**
 * Word-like keyboard behavior for the document designer.
 *
 * Tab / Shift-Tab:
 *  - Inside a list, indent/outdent the item (Word demotes/promotes list levels).
 *  - Otherwise insert/remove a real tab character. Rendered with `tab-size` +
 *    `white-space: pre-wrap` (globals.css) so it lands on a tab stop instead of
 *    collapsing to a single space, and Tab never escapes the editor to the next
 *    focusable control.
 *
 * A high priority makes this win over any default Tab binding.
 */
export const DocumentKeymap = Extension.create({
  name: "documentKeymap",
  priority: 200,

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (this.editor.can().sinkListItem("listItem")) {
          return this.editor.commands.sinkListItem("listItem");
        }
        // Only type a tab into real text — never replace a selected image/shape.
        if (this.editor.state.selection instanceof TextSelection) {
          return this.editor.commands.insertContent("\t");
        }
        return true;
      },
      "Shift-Tab": () => {
        if (this.editor.can().liftListItem("listItem")) {
          return this.editor.commands.liftListItem("listItem");
        }
        // Swallow so focus stays in the document instead of leaving the editor.
        return true;
      },
    };
  },
});
