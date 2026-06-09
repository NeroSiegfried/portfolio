// Skip in CI environments BEFORE importing anything
if (process.env.CI || process.env.VERCEL) {
  console.log('Skipping screenshot capture in CI environment');
  process.exit(0);
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const publicDir = path.join(rootDir, 'public', 'projects');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const projectsContent = fs.readFileSync(path.join(rootDir, 'components/projects.tsx'), 'utf-8');

const projectsMatch = projectsContent.match(/const projects: Project\[\]\s*=\s*\[([\s\S]*?)\]\n\n/);
if (!projectsMatch) {
  console.error("Could not find projects array");
  process.exit(1);
}

const extractField = (str, field) => {
  const match = str.match(new RegExp(`${field}:\\s*['"]([^'"]+)['"]`));
  return match ? match[1] : null;
};
const extractNumber = (str, field) => {
  const match = str.match(new RegExp(`${field}:\\s*([0-9]+)`));
  return match ? parseInt(match[1]) : null;
};

const regexProjects = [];
const blocks = projectsMatch[1].split('},');
for (const block of blocks) {
  if (!block.trim()) continue;
  const id = extractNumber(block, 'id');
  const liveUrl = extractField(block, 'liveUrl');
  const waitFor = extractNumber(block, 'waitFor') || 0;
  if (id && liveUrl) {
    regexProjects.push({ id, liveUrl, waitFor });
  }
}

// ── Device capture specs ──────────────────────────────────────────────────────
// dsf = deviceScaleFactor; the final PNG will be (width * dsf) × (height * dsf) px.
// lo  = 25 % of the PNG dimensions, JPEG 55 % — quick blurry preview
// md  = 50 % of the PNG dimensions, JPEG 75 % — good for 1× displays
// hi  = full PNG (the raw puppeteer output, unchanged)
const devices = [
  { name: 'macbook', width: 1440, height: 900,  dsf: 2, isMobile: false },
  { name: 'studio',  width: 2560, height: 1440, dsf: 2, isMobile: false },
  { name: 'ipad',    width: 834,  height: 1194, dsf: 2, isMobile: true  },
  { name: 'iphone',  width: 393,  height: 852,  dsf: 3, isMobile: true  },
];

/**
 * Generate lo and md JPEG tiers from an existing PNG.
 */
async function generateTiers(pngPath) {
  const img = sharp(pngPath);
  const { width, height } = await img.metadata();

  const mdPath = pngPath.replace('.png', '-md.jpg');
  await sharp(pngPath)
    .resize(Math.round(width * 0.5), Math.round(height * 0.5))
    .jpeg({ quality: 75 })
    .toFile(mdPath);

  const loPath = pngPath.replace('.png', '-lo.jpg');
  await sharp(pngPath)
    .resize(Math.round(width * 0.25), Math.round(height * 0.25))
    .jpeg({ quality: 55 })
    .toFile(loPath);

  console.log(`    tiers → ${path.basename(loPath)}, ${path.basename(mdPath)}`);
}

(async () => {
  console.log('Launching browser for screenshots...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors', '--disable-features=HttpsUpgrades'],
  });

  for (const proj of regexProjects) {
    console.log(`\nProject ${proj.id}: ${proj.liveUrl}`);
    for (const dev of devices) {
      console.log(`  [${dev.name}]`);
      const destFile = path.join(publicDir, `${proj.id}-${dev.name}.png`);

      const page = await browser.newPage();
      try {
        await page.setRequestInterception(true);
        page.on('request', (request) => {
          const reqUrl = request.url();
          const targetHost = new URL(proj.liveUrl).host;
          if (proj.liveUrl.startsWith('http://') && reqUrl.startsWith(`https://${targetHost}`)) {
            request.continue({ url: reqUrl.replace('https:', 'http:') });
          } else {
            request.continue();
          }
        });

        await page.setViewport({
          width: dev.width,
          height: dev.height,
          deviceScaleFactor: dev.dsf,
          isMobile: dev.isMobile,
          hasTouch: dev.isMobile,
        });

        try {
          await page.goto(proj.liveUrl, { waitUntil: 'networkidle0', timeout: 30000 });
        } catch (e) {
          console.warn(`    nav warning: ${e.message}`);
        }

        if (proj.waitFor > 0) {
          console.log(`    waiting ${proj.waitFor * 1000}ms...`);
          await new Promise(r => setTimeout(r, proj.waitFor * 1000));
        }

        await page.screenshot({ path: destFile });
        console.log(`    hi  → ${path.basename(destFile)}`);

        await generateTiers(destFile);
      } catch (err) {
        console.error(`    error: ${err.message}`);
      } finally {
        await page.close();
      }
    }
  }

  await browser.close();
  console.log('\nAll screenshots processed.');
})();
