#!/usr/bin/env osascript -l JavaScript

ObjC.import('AppKit');

// ==========================================
// CONFIGURATION
// ==========================================

// Target opacity: 252 out of 255 alpha channel value (~0.988 fraction)
const targetOpacity = 252.0 / 255.0;

// ==========================================
// MAIN PROCESSING
// ==========================================

const fm = $.NSFileManager.defaultManager;
const currentDir = fm.currentDirectoryPath.js;

// 1. Scan directory for files matching '.png'
const allFiles = fm.contentsOfDirectoryAtPathError(currentDir, null);
const targetFiles = [];

for (let i = 0; i < allFiles.count; i++) {
  const fileName = allFiles.objectAtIndex(i).js;
  if (fileName.endsWith(".png")) {
    targetFiles.push(fileName);
  }
}

if (targetFiles.length === 0) {
  console.log("[SKIP] No files matching '.png' found in current folder.");
} else {
  console.log(`Found ${targetFiles.length} file(s) with '.png'...\n`);
}

// 2. Process each image
targetFiles.forEach(filename => {
  const filePath = `${currentDir}/${filename}`;

  // Load file via raw Data and BitmapRep to get strict original pixel dimensions.
  const sourceData = $.NSData.dataWithContentsOfFile(filePath);
  const sourceRep = $.NSBitmapImageRep.imageRepWithData(sourceData);
  if (!sourceRep || !sourceRep.className) {
    console.log(`[ERROR] Could not load image data: ${filename}`);
    return;
  }

  const pWidth = sourceRep.pixelsWide;
  const pHeight = sourceRep.pixelsHigh;

  // Explicitly set point size to match pixels 1:1
  const sourceImage = $.NSImage.alloc.initWithSize($.NSMakeSize(pWidth, pHeight));
  sourceImage.addRepresentation(sourceRep);

  // --- THE FIX ---
  // NSImage's lockFocus/unlockFocus always renders through the *screen's*
  // backing scale factor (2x on Retina), no matter what size you give the
  // NSImage. That's what was silently doubling your pixel dimensions.
  // Instead, build the destination as a plain NSBitmapImageRep with the
  // EXACT pixel dimensions we want, and draw into a graphics context tied
  // to that bitmap (not to any screen). No scale factor involved.
  const destRep = $.NSBitmapImageRep.alloc.initWithBitmapDataPlanesPixelsWidePixelsHighBitsPerSampleSamplesPerPixelHasAlphaIsPlanarColorSpaceNameBytesPerRowBitsPerPixel(
    Ref(),      // planes: NULL -> let it allocate its own (zeroed) buffer
    pWidth,
    pHeight,
    8,          // bitsPerSample
    4,          // samplesPerPixel (RGBA)
    true,       // hasAlpha
    false,      // isPlanar
    $.NSDeviceRGBColorSpace,
    0,          // bytesPerRow (0 = auto)
    32          // bitsPerPixel
  );

  const context = $.NSGraphicsContext.graphicsContextWithBitmapImageRep(destRep);
  $.NSGraphicsContext.setCurrentContext(context);

  // --- FORCE NEAREST-NEIGHBOR (SHARP) FILTERING ---
  context.imageInterpolation = $.NSImageInterpolationNone;

  // Clear to transparent first so any partially-transparent source pixels
  // composite correctly instead of over uninitialized memory.
  $.NSColor.clearColor.set;
  $.NSBezierPath.fillRect($.NSMakeRect(0, 0, pWidth, pHeight));

  // Draw the image at target opacity within exact pixel bounds
  sourceImage.drawInRectFromRectOperationFraction(
    $.NSMakeRect(0, 0, pWidth, pHeight),
    $.NSZeroRect,
    $.NSCompositeSourceOver,
    targetOpacity
  );

  // Export straight from the bitmap rep we built (already RGBA, already
  // exact pixel size) - no TIFF round-trip needed.
  const pngData = destRep.representationUsingTypeProperties($.NSPNGFileType, $());
  const success = pngData.writeToFileAtomically(filePath, true);

  if (success) {
    console.log(`[UPDATED] ${filename} -> forced RGB, orig-res (${pWidth}x${pHeight}), sharp, 252/255 alpha`);
  } else {
    console.log(`[ERROR] Failed to save: ${filename}`);
  }
});

console.log("\n[SUCCESS] Finished updating all '.png' files!");