import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

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

const devices = [
  { name: 'macbook', width: 1440, height: 900, dsf: 2, isMobile: false },
  { name: 'studio', width: 2560, height: 1440, dsf: 2, isMobile: false },
  { name: 'ipad', width: 834, height: 1194, dsf: 2, isMobile: true },
  { name: 'iphone', width: 393, height: 852, dsf: 3, isMobile: true }
];

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200 && res.statusCode !== 302 && res.statusCode !== 301) {
        return reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
      }
      
      if (res.statusCode === 302 || res.statusCode === 301) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

(async () => {
  for (const proj of regexProjects) {
    for (const dev of devices) {
      const qs = [
        `url=${encodeURIComponent(proj.liveUrl)}`,
        'screenshot=true',
        'embed=screenshot.url',
        `viewport.width=${dev.width}`,
        `viewport.height=${dev.height}`,
        `viewport.deviceScaleFactor=${dev.dsf}`
      ];
      if (dev.isMobile) qs.push('viewport.isMobile=true');
      if (proj.waitFor > 0) qs.push(`waitFor=${proj.waitFor * 1000}`);
      
      const microlinkUrl = `https://api.microlink.io/?${qs.join('&')}`;
      const destFile = path.join(publicDir, `${proj.id}-${dev.name}.png`);
      
      console.log(`Downloading ${dev.name} snapshot for project ${proj.id}...`);
      try {
        await download(microlinkUrl, destFile);
        console.log(`Saved ${destFile}`);
      } catch (err) {
        console.error(`Error downloading ${destFile}:`, err);
      }
    }
  }
  console.log("All screenshots processed.");
})();
