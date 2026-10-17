#!/usr/bin/env osascript -l JavaScript

ObjC.import('AppKit');

// ==========================================
// CONFIGURATION
// ==========================================

// 100 out of 255 alpha channel value (~0.392 fraction)
const targetOpacity = 100.0 / 255.0;

// ==========================================
// MAIN PROCESSING
// ==========================================

const fm = $.NSFileManager.defaultManager;
const currentDir = fm.currentDirectoryPath.js;

// 1. Scan directory for files matching '*_s.png'
const allFiles = fm.contentsOfDirectoryAtPathError(currentDir, null);
const targetFiles = [];

for (let i = 0; i < allFiles.count; i++) {
    const fileName = allFiles.objectAtIndex(i).js;
    if (fileName.endsWith("_s.png") || fileName.includes("_s.png")) {
        targetFiles.push(fileName);
    }
}

if (targetFiles.length === 0) {
    console.log("[SKIP] No files matching '_s.png' found in current folder.");
} else {
    console.log(`Found ${targetFiles.length} file(s) with '_s.png'...\n`);
}

// 2. Process each image to 100/255 alpha
targetFiles.forEach(filename => {
    const filePath = `${currentDir}/${filename}`;

    const sourceImage = $.NSImage.alloc.initWithContentsOfFile(filePath);
    if (!sourceImage.className) {
        console.log(`[ERROR] Could not load image: ${filename}`);
        return;
    }

    const size = sourceImage.size;
    const newImage = $.NSImage.alloc.initWithSize(size);

    // Draw source image onto fresh canvas at 100/255 fraction
    newImage.lockFocus;
    sourceImage.drawInRectFromRectOperationFraction(
        $.NSMakeRect(0, 0, size.width, size.height),
        $.NSZeroRect,
        $.NSCompositeSourceOver,
        targetOpacity
    );
    newImage.unlockFocus;

    // Export back to PNG
    const tiffData = newImage.TIFFRepresentation;
    const bitmap = $.NSBitmapImageRep.imageRepWithData(tiffData);
    const pngData = bitmap.representationUsingTypeProperties($.NSPNGFileType, $());

    // Overwrite file
    const success = pngData.writeToFileAtomically(filePath, true);

    if (success) {
        console.log(`[UPDATED] ${filename} -> set alpha to 100/255`);
    } else {
        console.log(`[ERROR] Failed to save: ${filename}`);
    }
});

console.log("\n[SUCCESS] Finished updating all '_s.png' files to 100/255 opacity!");