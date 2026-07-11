import sharp from 'sharp'
import { readdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIRS = [
  path.join(__dirname, '../public/images/modes'),
  path.join(__dirname, '../public/images/themes')
]

async function optimizeImages() {
  for (const dir of DIRS) {
    if (!existsSync(dir)) continue;
    const files = await readdir(dir)
    const imgFiles = files.filter(f => f.endsWith('.png') || f.endsWith('.jpeg') || f.endsWith('.jpg'))
    
    for (const file of imgFiles) {
      const inputPath = path.join(dir, file)
      const outputName = file.replace(/\.(png|jpe?g)$/, '.webp')
      const outputPath = path.join(dir, outputName)
      
      try {
        const metadata = await sharp(inputPath).metadata()
        const maxWidth = 800
        const maxHeight = 800
        
        let resizeOpts = {}
        if ((metadata.width || 0) > maxWidth || (metadata.height || 0) > maxHeight) {
          resizeOpts = { width: maxWidth, height: maxHeight, fit: 'inside', withoutEnlargement: true }
        }

        await sharp(inputPath)
          .resize(resizeOpts)
          .webp({ quality: 80, effort: 4 })
          .toFile(outputPath)
          
        console.log(`Optimized ${file} -> ${outputName}`)
        
        // Remove original to save space
        await unlink(inputPath)
      } catch(e) {
        console.error(`Failed ${file}:`, e)
      }
    }
  }
}
optimizeImages()
