#!/usr/bin/env osascript -l JavaScript

const app = Application.currentApplication();
app.includeStandardAdditions = true;

// ==========================================
// CONFIGURATION
// ==========================================

const templateFile = "diamond_spear.json";
const materials = ["wooden", "stone", "copper", "iron", "golden", "netherite"];

// ==========================================
// MAIN PROCESSING
// ==========================================

try {
    // 1. Read the template file using relative path
    const text = app.read(Path(templateFile));

    materials.forEach(material => {
        // 2. Generate new file name (e.g., wooden_sword.json)
        const newFileName = templateFile.replace("diamond", material);

        // 3. Replace lowercase, capitalized, and uppercase occurrences
        let updatedText = text
            .split("diamond").join(material)
            .split("Diamond").join(material.charAt(0).toUpperCase() + material.slice(1))
            .split("DIAMOND").join(material.toUpperCase());

        // 4. Save file
        const file = app.openForAccess(Path(newFileName), { writePermission: true });
        app.setEof(file, { to: 0 }); // Overwrite if file exists
        app.write(updatedText, { to: file });
        app.closeAccess(file);

        console.log(`[CREATED] ${newFileName}`);
    });

    console.log(`\n[SUCCESS] Generated ${materials.length} JSON files. '${templateFile}' left untouched.`);

} catch (err) {
    console.log(`[ERROR] Could not read '${templateFile}'.`);
    console.log("Verify that 'diamond_sword.json' is inside your current folder by running 'ls'.");
}