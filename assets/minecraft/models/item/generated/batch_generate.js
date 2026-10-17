#!/usr/bin/env osascript -l JavaScript

const app = Application.currentApplication();
app.includeStandardAdditions = true;

// ==========================================
// CONFIGURATION
// ==========================================

const templateFile = "diamond_spear_in_hand.json";
const tools = ["spear_in_hand"];
const materials = ["wooden", "stone", "copper", "iron", "golden", "diamond", "netherite"];

// ==========================================
// MAIN PROCESSING
// ==========================================

try {
    const text = app.read(Path(templateFile));
    let totalCreated = 0;

    tools.forEach(tool => {
        materials.forEach(material => {
            // Keep original template file intact
            if (tool === "spear_in_hand" && material === "diamond") {
                return;
            }

            const newFileName = `${material}_${tool}.json`;

            // 1. Replace tool name (lowercase only)
            let updatedText = text.split("spear_in_hand").join(tool);

            // 2. Replace material name (lowercase only)
            updatedText = updatedText.split("diamond").join(material);

            // 3. Save file
            const file = app.openForAccess(Path(newFileName), { writePermission: true });
            app.setEof(file, { to: 0 });
            app.write(updatedText, { to: file });
            app.closeAccess(file);

            console.log(`[CREATED] ${newFileName}`);
            totalCreated++;
        });
    });

    console.log(`\n[SUCCESS] Generated ${totalCreated} JSON files. '${templateFile}' remains untouched.`);

} catch (err) {
    console.log(`[ERROR] Could not read '${templateFile}'.`);
}