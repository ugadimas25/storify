import sharp from "sharp";
import path from "path";
import fs from "fs";

const ANDROID_RES = path.resolve("android/app/src/main/res");
const LOGO_PATH = path.resolve("assets/logo.png");
const FAVICON_PATH = path.resolve("client/public/favicon.png");

// Dark background color matching the app theme
const BG_COLOR = "#1a1a2e";
// White color for icon background
const WHITE = "#ffffff";

// Android launcher icon sizes per density
const ICON_SIZES: Record<string, number> = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

// Adaptive icon foreground sizes (108dp with 18dp safe area each side)
const FOREGROUND_SIZES: Record<string, number> = {
  "mipmap-mdpi": 108,
  "mipmap-hdpi": 162,
  "mipmap-xhdpi": 216,
  "mipmap-xxhdpi": 324,
  "mipmap-xxxhdpi": 432,
};

// Splash screen sizes (portrait)
const SPLASH_PORT_SIZES: Record<string, { w: number; h: number }> = {
  "drawable-port-mdpi": { w: 320, h: 480 },
  "drawable-port-hdpi": { w: 480, h: 800 },
  "drawable-port-xhdpi": { w: 720, h: 1280 },
  "drawable-port-xxhdpi": { w: 960, h: 1600 },
  "drawable-port-xxxhdpi": { w: 1280, h: 1920 },
};

// Splash screen sizes (landscape)
const SPLASH_LAND_SIZES: Record<string, { w: number; h: number }> = {
  "drawable-land-mdpi": { w: 480, h: 320 },
  "drawable-land-hdpi": { w: 800, h: 480 },
  "drawable-land-xhdpi": { w: 1280, h: 720 },
  "drawable-land-xxhdpi": { w: 1600, h: 960 },
  "drawable-land-xxxhdpi": { w: 1920, h: 1280 },
};

async function generateIcon(
  logoBuffer: Buffer,
  size: number,
  outputPath: string,
  isRound: boolean = false
) {
  // For the icon, we want the logo centered on a white background
  // with padding so it looks clean
  const padding = Math.round(size * 0.12);
  const logoSize = size - padding * 2;

  const resizedLogo = await sharp(logoBuffer)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toBuffer();

  let icon = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: resizedLogo,
        gravity: "center",
      },
    ])
    .png();

  if (isRound) {
    // Create circular mask
    const circleSvg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
      </svg>`
    );

    const tempBuffer = await icon.toBuffer();
    icon = sharp(tempBuffer).composite([
      {
        input: circleSvg,
        blend: "dest-in",
      },
    ]).png();
  }

  await icon.toFile(outputPath);
}

async function generateForeground(
  logoBuffer: Buffer,
  size: number,
  outputPath: string
) {
  // Adaptive icon foreground: logo centered in the safe zone
  // Safe zone is the center 66% (72dp out of 108dp)
  const safeZone = Math.round(size * (66.67 / 100));
  const logoSize = Math.round(safeZone * 0.85);

  const resizedLogo = await sharp(logoBuffer)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: resizedLogo,
        gravity: "center",
      },
    ])
    .png()
    .toFile(outputPath);
}

async function generateSplash(
  logoBuffer: Buffer,
  width: number,
  height: number,
  outputPath: string
) {
  // Splash screen: logo centered on dark background
  const minDim = Math.min(width, height);
  const logoWidth = Math.round(minDim * 0.6);
  const logoHeight = Math.round(logoWidth * 0.4); // Logo is wider than tall

  const resizedLogo = await sharp(logoBuffer)
    .resize(logoWidth, logoHeight, { fit: "contain", background: { r: 26, g: 26, b: 46, alpha: 1 } })
    .toBuffer();

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 26, g: 26, b: 46, alpha: 1 }, // #1a1a2e
    },
  })
    .composite([
      {
        input: resizedLogo,
        gravity: "center",
      },
    ])
    .png()
    .toFile(outputPath);
}

async function main() {
  console.log("🎨 Generating Android icons and splash screens from logo...\n");

  const logoBuffer = fs.readFileSync(LOGO_PATH);
  const logoMeta = await sharp(logoBuffer).metadata();
  console.log(`Source logo: ${logoMeta.width}x${logoMeta.height} (${logoMeta.format})\n`);

  // 1. Generate launcher icons (ic_launcher.png)
  console.log("📱 Generating launcher icons...");
  for (const [folder, size] of Object.entries(ICON_SIZES)) {
    const dir = path.join(ANDROID_RES, folder);
    fs.mkdirSync(dir, { recursive: true });

    const iconPath = path.join(dir, "ic_launcher.png");
    await generateIcon(logoBuffer, size, iconPath, false);
    console.log(`  ✅ ${folder}/ic_launcher.png (${size}x${size})`);

    const roundPath = path.join(dir, "ic_launcher_round.png");
    await generateIcon(logoBuffer, size, roundPath, true);
    console.log(`  ✅ ${folder}/ic_launcher_round.png (${size}x${size})`);
  }

  // 2. Generate adaptive icon foregrounds
  console.log("\n🔲 Generating adaptive icon foregrounds...");
  for (const [folder, size] of Object.entries(FOREGROUND_SIZES)) {
    const dir = path.join(ANDROID_RES, folder);
    fs.mkdirSync(dir, { recursive: true });

    const fgPath = path.join(dir, "ic_launcher_foreground.png");
    await generateForeground(logoBuffer, size, fgPath);
    console.log(`  ✅ ${folder}/ic_launcher_foreground.png (${size}x${size})`);
  }

  // 3. Generate portrait splash screens
  console.log("\n🖼️  Generating portrait splash screens...");
  for (const [folder, { w, h }] of Object.entries(SPLASH_PORT_SIZES)) {
    const dir = path.join(ANDROID_RES, folder);
    fs.mkdirSync(dir, { recursive: true });

    const splashPath = path.join(dir, "splash.png");
    await generateSplash(logoBuffer, w, h, splashPath);
    console.log(`  ✅ ${folder}/splash.png (${w}x${h})`);
  }

  // 4. Generate landscape splash screens
  console.log("\n🖼️  Generating landscape splash screens...");
  for (const [folder, { w, h }] of Object.entries(SPLASH_LAND_SIZES)) {
    const dir = path.join(ANDROID_RES, folder);
    fs.mkdirSync(dir, { recursive: true });

    const splashPath = path.join(dir, "splash.png");
    await generateSplash(logoBuffer, w, h, splashPath);
    console.log(`  ✅ ${folder}/splash.png (${w}x${h})`);
  }

  // 5. Default splash (drawable/)
  console.log("\n📱 Generating default splash...");
  const defaultSplashDir = path.join(ANDROID_RES, "drawable");
  fs.mkdirSync(defaultSplashDir, { recursive: true });
  await generateSplash(logoBuffer, 480, 800, path.join(defaultSplashDir, "splash.png"));
  console.log("  ✅ drawable/splash.png (480x800)");

  // 6. Generate web favicon
  console.log("\n🌐 Generating web favicon...");
  await sharp(logoBuffer)
    .resize(192, 192, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(FAVICON_PATH);
  console.log(`  ✅ client/public/favicon.png (192x192)`);

  // 7. Generate Play Store icon (512x512)
  console.log("\n🏪 Generating Play Store icon (512x512)...");
  const storeDir = path.resolve("assets");
  fs.mkdirSync(storeDir, { recursive: true });
  await generateIcon(logoBuffer, 512, path.join(storeDir, "icon-512.png"), false);
  console.log("  ✅ assets/icon-512.png (512x512)");

  console.log("\n🎉 All icons and splash screens generated successfully!");
  console.log("\nGenerated:");
  console.log("  - 5 launcher icons (mdpi → xxxhdpi)");
  console.log("  - 5 round launcher icons");
  console.log("  - 5 adaptive foregrounds");
  console.log("  - 5 portrait splash screens");
  console.log("  - 5 landscape splash screens");
  console.log("  - 1 default splash screen");
  console.log("  - 1 web favicon (192x192)");
  console.log("  - 1 Play Store icon (512x512)");
}

main().catch(console.error);
