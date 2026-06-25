// Minimal ambient types for the `qrcode` package (no @types published that we
// rely on). Covers only the server-side `toString` SVG API used in the app.
declare module "qrcode" {
  interface QRCodeToStringOptions {
    type?: "svg" | "utf8" | "terminal";
    margin?: number;
    width?: number;
    errorCorrectionLevel?: "low" | "medium" | "quartile" | "high" | "L" | "M" | "Q" | "H";
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export function toString(
    text: string,
    options?: QRCodeToStringOptions,
  ): Promise<string>;

  const _default: {
    toString: typeof toString;
  };
  export default _default;
}
