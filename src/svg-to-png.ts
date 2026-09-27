import { Resvg } from "npm:@resvg/resvg-js";

const iconsDir = "../icons";

try {
	for await (const entry of Deno.readDir(iconsDir)) {
		if (!entry.isDirectory) continue;

		// for now only provide the "dawn" theme
		if (entry.name !== "dawn") continue;

		const themeDir = `${iconsDir}/${entry.name}`;

		for await (const svg of Deno.readDir(themeDir)) {
			const allowed = [
				"folder_teal.svg",
				"folder_sky.svg",
				"folder_red.svg",
				"folder_purple.svg",
				"folder_pink.svg",
				"folder_orange.svg",
				"folder_lime.svg",
				"folder_green.svg",
				"folder_gray.svg",
				"folder_brown.svg",
				"folder_blue.svg",
				"folder_yellow.svg",
				"folder_teal_open.svg",
				"folder_sky_open.svg",
				"folder_red_open.svg",
				"folder_purple_open.svg",
				"folder_pink_open.svg",
				"folder_orange_open.svg",
				"folder_lime_open.svg",
				"folder_green_open.svg",
				"folder_gray_open.svg",
				"folder_brown_open.svg",
				"folder_blue_open.svg",
				"folder_yellow_open.svg",

			];
	  			if (svg.name.includes('folder') && !allowed.includes(svg.name)) continue

				if (svg.isFile && svg.name.toLowerCase().endsWith(".svg")) {
					const svgPath = `${themeDir}/${svg.name}`;
					for (const [size, pngPath, savePath] of [
						[
							16,
							`${themeDir}/file_type_${svg.name.replace(/\.svg$/i, ".png").replaceAll('__', '_')}`,
							`${iconsDir}/file_type_${svg.name.replace(/\.svg$/i, ".png").replaceAll('__', '_')}`,
						],
						[
							32,
							`${themeDir}/file_type_${svg.name.replace(/\.svg$/i, "@2x.png").replaceAll('__', '_')}`,
							`${iconsDir}/file_type_${svg.name.replace(/\.svg$/i, "@2x.png").replaceAll('__', '_')}`,
						],
						[
							48,
							`${themeDir}/file_type_${svg.name.replace(/\.svg$/i, "@3x.png").replaceAll('__', '_')}`,
							`${iconsDir}/file_type_${svg.name.replace(/\.svg$/i, "@3x.png").replaceAll('__', '_')}`,
						],
					]) {
						try {
							const svgData = await Deno.readFile(svgPath);
							const resvg = new Resvg(svgData, {
								fitTo: {
									mode: "width",
									value: size,
								},
							});
							const pngBuffer = resvg.render().asPng();
							await Deno.writeFile(savePath, pngBuffer);

							console.log(`Converted: ${svg.name} -> ${pngPath}`);
						} catch (err) {
							console.error(`❌ Failed to convert ${svg.name}:`, err);
						}
					}
				}
		}
	}

	console.log("Done");
} catch (error) {
	console.error(error);
	Deno.exit(1);
}
