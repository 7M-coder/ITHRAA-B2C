import { spawnSync } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'
import { stripVTControlCharacters } from 'node:util'
import process from 'node:process'
import console from 'node:console'

/** Captures the frontend build result in Netlify's deploy summary when its log viewer is unavailable. @param event - Netlify build utilities. @returns Nothing; a failed build remains failed. */
export const onPreBuild = ({ utils }) => {
  const cwd = fileURLToPath(new URL('../', import.meta.url))
  const result = spawnSync('npm', ['run', 'build'], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    timeout: 180000
  })
  const output = stripVTControlCharacters(`${result.stdout ?? ''}\n${result.stderr ?? ''}`)
  console.log(output)
  const environment = `Node ${process.version}, ${process.platform}/${process.arch}`
  const failed = result.status !== 0 || Boolean(result.error)
  const summary = failed
    ? `Frontend build failed: ${result.error?.message ?? `exit ${result.status}, signal ${result.signal ?? 'none'}`}`
    : 'The frontend production build passed.'
  utils.status.show({
    title: 'Frontend build diagnostics',
    summary: `${summary} (${environment})`,
    text: output.slice(-15000)
  })
  if (failed) {
    const detail = output
      .split('\n')
      .filter((line) => /error TS\d+|Error:|Cannot find|Could not resolve/i.test(line))
      .slice(0, 8)
      .join('\n')
    utils.build.failBuild(`${summary}\n${detail || output.slice(-1500)}`)
  }
}
