/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />
import { Resvg } from "npm:@resvg/resvg-js";
import { Buffer } from "node:buffer";
import type { RenderJob } from "./types.ts";

const sizes = [[16, ""], [32, "@2x"], [48, "@3x"]] as const;

self.onmessage = async (event: MessageEvent<RenderJob | null>) => {
  const job = event.data;
  if (!job) {
    self.close();
    return;
  }
  try {
    const svg = await Deno.readFile(new URL(job.source));
    for (const [size, suffix] of sizes) {
      const png = new Resvg(Buffer.from(svg), {
        fitTo: { mode: "width", value: size },
        // The icons are pure paths; skipping the system font scan that resvg
        // otherwise repeats per instance is the single biggest speedup here.
        font: { loadSystemFonts: false },
      }).render().asPng();
      if (new DataView(png.buffer, png.byteOffset, png.byteLength).getUint32(16) !== size) {
        throw new Error(`Unexpected PNG size: ${job.name}`);
      }
      await Deno.writeFile(new URL(`${job.dest}${suffix}.png`), png);
    }
    self.postMessage({ ok: true });
  } catch (error) {
    self.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
};
