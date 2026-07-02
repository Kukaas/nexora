import { Extension } from "@tiptap/core";

/**
 * Adds a `letterSpacing` attribute to the `textStyle` mark, mirroring the
 * built-in `FontSize` from `@tiptap/extension-text-style` (which has no
 * letter-spacing counterpart). Serializes to `<span style="letter-spacing: …">`
 * so tracked/loose text reproduces exactly in the print view, which renders the
 * stored HTML as-is.
 */
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    letterSpacing: {
      /** Set the CSS letter-spacing on the current selection (e.g. "0.5px"). */
      setLetterSpacing: (value: string) => ReturnType;
      /** Clear any letter-spacing back to the font default. */
      unsetLetterSpacing: () => ReturnType;
    };
  }
}

export const LetterSpacing = Extension.create({
  name: "letterSpacing",

  addOptions() {
    return { types: ["textStyle"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          letterSpacing: {
            default: null,
            parseHTML: (element) => element.style.letterSpacing || null,
            renderHTML: (attributes) =>
              attributes.letterSpacing
                ? { style: `letter-spacing: ${attributes.letterSpacing}` }
                : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLetterSpacing:
        (value) =>
        ({ chain }) =>
          chain().setMark("textStyle", { letterSpacing: value }).run(),
      unsetLetterSpacing:
        () =>
        ({ chain }) =>
          chain()
            .setMark("textStyle", { letterSpacing: null })
            .removeEmptyTextStyle()
            .run(),
    };
  },
});
