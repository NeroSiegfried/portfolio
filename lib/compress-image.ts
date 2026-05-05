/**
 * Client-side image compression using the Canvas API.
 * GIFs are returned as-is (canvas re-encoding destroys animation).
 * Already-small files are returned as-is to avoid quality loss.
 */
export async function compressImage(
  file: File,
  opts: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    /** If the file is already smaller than this, skip re-encoding. */
    skipBelowBytes?: number
  } = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    skipBelowBytes = 300 * 1024,
  } = opts

  // Can't compress GIF without losing animation
  if (file.type === "image/gif") return file

  // Already small enough — no quality loss from unnecessary re-encode
  if (file.size <= skipBelowBytes) return file

  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img
      const aspect = width / height

      if (width > maxWidth) {
        width = maxWidth
        height = width / aspect
      }
      if (height > maxHeight) {
        height = maxHeight
        width = height * aspect
      }

      const canvas = document.createElement("canvas")
      canvas.width = Math.round(width)
      canvas.height = Math.round(height)
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          resolve(
            new File(
              [blob],
              file.name.replace(/\.[^.]+$/, ".jpg"),
              { type: "image/jpeg" }
            )
          )
        },
        "image/jpeg",
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("Failed to load image for compression"))
    }
    img.src = objectUrl
  })
}
