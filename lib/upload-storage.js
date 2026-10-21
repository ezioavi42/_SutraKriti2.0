import path from 'node:path'

export function getUploadRoot() {
  const configured = process.env.UPLOAD_DIR || 'public/products'
  if (path.isAbsolute(configured)) return configured

  const cwd = process.cwd()
  const isStandaloneRuntime = path.basename(cwd) === 'standalone' &&
    path.basename(path.dirname(cwd)) === '.next'
  const appRoot = isStandaloneRuntime ? path.resolve(cwd, '..', '..') : cwd
  return path.resolve(appRoot, configured)
}