const icons = await import("../icon_themes/flow-icons.json", {
	with: { type: "json" },
});

console.log(icons);

const themeNameToIconsFolder = {
  "Flow Dawn": 'dawn',
}

for (const theme of icons.default["themes"]) {
  // for now only provide the "dim" theme
  if (theme.name !== 'Flow Dawn') continue

  const customIconsForSublime = {
      "txt": "file_type_text",
      "sublime-file-icons": "file_type_sublime",
      "sublime-theme": "file_type_sublime",
      "sublime-color-scheme": "file_type_sublime",
      "hidden-color-scheme": "file_type_sublime",
      "sublime-menu": "file_type_sublime",
      "sublime-commands": "file_type_sublime",
      "sublime-keymap": "file_type_sublime",
      "sublime-settings": "file_type_sublime",
      "sublime-syntax": "file_type_sublime",
      "pyi": "file_type_python",
  }
	const icon_map: {icons: Record<string, string>} = {
		icons: {
      ...customIconsForSublime
      //key is file_name, value is icon
    }
	};
	for (const [file_stems, icon] of Object.entries(theme["file_stems"])) {
    icon_map.icons[file_stems] = `file_type_${icon}`.replace('__', "_")
	}
  for (const [file_stems, icon] of Object.entries(theme["file_suffixes"])) {
    icon_map.icons[file_stems] = `file_type_${icon}`.replace('__', "_")
  }

	await Deno.writeTextFile(
		`../${theme["name"]}.sublime-file-icons`,
		JSON.stringify(icon_map, null, 4),
	);
}

export {};
