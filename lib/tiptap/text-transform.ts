import { Extension } from "@tiptap/core";

/**
 * Adds a `textTransform` attribute to the `textStyle` mark, mirroring the
 * built-in `FontSize` from `@tiptap/extension-text-style` (which has no
 * text-transform counterpart). Serializes to `<span style="text-transform: …">`
 * so the casing reproduces exactly in the print view, which renders the stored
 * HTML as-is.
 *
 * Because it's CSS (not a rewrite of the characters), it uppercases whatever the
 * span contains at render time — including a merge-field chip, so `NAME: {Full
 * name}` prints the resident's actual name in CAPS without altering the stored
 * value. It's also fully reversible (toggle off → back to the typed casing).
 */

export type TextTransform = "uppercase" | "lowercase" | "capitalize";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textTransform: {
      /** Set the CSS text-transform on the current selection. */
      setTextTransform: (value: TextTransform) => ReturnType;
      /** Clear any text-transform back to the typed casing. */
      unsetTextTransform: () => ReturnType;
      /** Uppercase the selection, or clear it if it's already uppercased. */
      toggleUppercase: () => ReturnType;
    };
  }
}

export const TextTransformMark = Extension.create({
  name: "textTransform",

  addOptions() {
    return { types: ["textStyle"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textTransform: {
            default: null,
            parseHTML: (element) => element.style.textTransform || null,
            renderHTML: (attributes) =>
              attributes.textTransform
                ? { style: `text-transform: ${attributes.textTransform}` }
                : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextTransform:
        (value) =>
        ({ chain }) =>
          chain().setMark("textStyle", { textTransform: value }).run(),
      unsetTextTransform:
        () =>
        ({ chain }) =>
          chain()
            .setMark("textStyle", { textTransform: null })
            .removeEmptyTextStyle()
            .run(),
      toggleUppercase:
        () =>
        ({ editor, chain }) =>
          editor.getAttributes("textStyle").textTransform === "uppercase"
            ? chain()
                .setMark("textStyle", { textTransform: null })
                .removeEmptyTextStyle()
                .run()
            : chain()
                .setMark("textStyle", { textTransform: "uppercase" })
                .run(),
    };
  },
});
