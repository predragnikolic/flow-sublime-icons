import { renderAll } from "./pool.ts";
import type { RenderJob } from "./types.ts";

const root = new URL("../", import.meta.url);
// Aliases resolved against the palette's own SVGs, so they get the palette prefix.
const aliasIcons: Record<string, string> = { pyi: "python" };

// Palette-independent icons that ship as plain PNGs in icons/, used verbatim.
const sharedIcons: Record<string, string> = Object.fromEntries([
  "sublime-file-icons", "sublime-theme", "sublime-color-scheme",
  "hidden-color-scheme", "sublime-menu", "sublime-commands",
  "sublime-keymap", "sublime-settings", "sublime-syntax",
].map(extension => [extension, "file_type_sublime"]));

export async function build(palettes: string[], light: boolean) {
  const { themes } = JSON.parse(await Deno.readTextFile(new URL("icon_themes/flow-icons.json", root)));
  const jobs: RenderJob[] = [];
  const variants: { name: string; prefix: string; available: Set<string>; theme: Record<string, unknown> }[] = [];

  for (const palette of palettes) {
    const base = `Flow ${palette[0].toUpperCase()}${palette.slice(1)}`;
    const name = light ? `${base} (Light)` : base;
    const theme = themes.find((item: { name: string }) => item.name === name);
    if (!theme) throw new Error(`Missing theme: ${name}`);
    const prefix = `file_type_flow_${palette}${light ? "_light" : ""}_`;
    const source = new URL(`icons/${palette}${light ? "-light" : ""}/`, root);
    const available = new Set<string>();
    for await (const entry of Deno.readDir(source)) {
      if (!entry.isFile || !entry.name.endsWith(".svg")) continue;
      const id = entry.name.slice(0, -4);
      available.add(id);
      jobs.push({
        name: `${name}/${entry.name}`,
        source: new URL(entry.name, source).href,
        dest: new URL(`icons/${prefix}${id.replaceAll("__", "_")}`, root).href,
      });
    }
    variants.push({ name, prefix, available, theme });
  }

  // Resolve and validate every mapping up front so a bad icon id fails in
  // seconds instead of after the whole render pass.
  const resolved = variants.map(({ name, prefix, available, theme }) => {
    const icons: Record<string, string> = {};
    const mappings = {
      ...theme.file_suffixes as Record<string, string>,
      ...theme.file_stems as Record<string, string>,
      ...aliasIcons,
      txt: available.has("text") ? "text" : "document",
    };
    for (const [key, value] of Object.entries(mappings)) {
      const id = String(value);
      if (!available.has(id)) throw new Error(`Missing ${name} icon: ${id} (${key})`);
      icons[key] = `${prefix}${id.replaceAll("__", "_")}`;
    }
    return { name, count: available.size, icons: { ...icons, ...sharedIcons } };
  });

  for (const icon of new Set(Object.values(sharedIcons))) {
    await Deno.stat(new URL(`icons/${icon}.png`, root)).catch(() => {
      throw new Error(`Missing shared icon: icons/${icon}.png`);
    });
  }

  const workers = Math.min(jobs.length, navigator.hardwareConcurrency || 4);
  console.log(`Rendering ${jobs.length} SVGs on ${workers} workers...`);
  const started = performance.now();
  await renderAll(jobs, (done, total) => {
    if (done % 100 === 0 || done === total) console.log(`rendered ${done}/${total} SVGs`);
  });
  console.log(`Rendered in ${((performance.now() - started) / 1000).toFixed(1)}s`);

  for (const { name, count, icons } of resolved) {
    await Deno.writeTextFile(new URL(`${name}.sublime-file-icons`, root), JSON.stringify({ icons }, null, 4) + "\n");
    console.log(`${name}: ${count * 3} PNGs, ${Object.keys(icons).length} mappings`);
  }
}
