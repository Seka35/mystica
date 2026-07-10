// scripts/optimizeImages.mjs
// Converts all tarot PNGs to WebP, max 640px wide, quality 80
// Run: node scripts/optimizeImages.mjs

import sharp from 'sharp'
import { readdir, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SOURCE_DIR = path.join(__dirname, '../../output')
const DEST_DIR = path.join(__dirname, '../public/cards')

async function optimizeImages() {
  if (!existsSync(DEST_DIR)) {
    await mkdir(DEST_DIR, { recursive: true })
  }

  const files = await readdir(SOURCE_DIR)
  const pngFiles = files.filter(f => f.endsWith('.png'))

  console.log(`🔮 Optimizing ${pngFiles.length} tarot cards...`)
  let success = 0

  for (const file of pngFiles) {
    const inputPath = path.join(SOURCE_DIR, file)
    const outputName = file.replace('.png', '.webp')
    const outputPath = path.join(DEST_DIR, outputName)

    if (existsSync(outputPath)) {
      console.log(`  ✓ Skipping (exists): ${outputName}`)
      success++
      continue
    }

    try {
      const metadata = await sharp(inputPath).metadata()
      const maxWidth = 640
      const maxHeight = 900

      let resizeOpts = {}
      if ((metadata.width || 0) > maxWidth || (metadata.height || 0) > maxHeight) {
        resizeOpts = { width: maxWidth, height: maxHeight, fit: 'inside', withoutEnlargement: true }
      }

      await sharp(inputPath)
        .resize(resizeOpts)
        .webp({ quality: 82, effort: 4 })
        .toFile(outputPath)

      const inputSizeMB = ((await import('fs')).statSync(inputPath).size / 1024 / 1024).toFixed(1)
      const outputSizeKB = ((await import('fs')).statSync(outputPath).size / 1024).toFixed(0)
      console.log(`  ✓ ${file} → ${outputName}  (${inputSizeMB}MB → ${outputSizeKB}KB)`)
      success++
    } catch (err) {
      console.error(`  ✗ Failed: ${file}`, err.message)
    }
  }

  console.log(`\n✅ Done: ${success}/${pngFiles.length} cards optimized → ${DEST_DIR}`)
}

optimizeImages()
