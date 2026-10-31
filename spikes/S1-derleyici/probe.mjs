import { launch } from '../../skill/scripts/lib/cdp.mjs'
import { pathToFileURL } from 'node:url'
const b = await launch()
await b.goto(pathToFileURL(process.argv[2]).href)
console.log(JSON.stringify(await b.eval('window.R'), null, 1))
await new Promise(r => setTimeout(r, 1300))
console.log('after play 1.3s (pause at 1.0):', await b.eval('[tl.time().toFixed(2), tl.paused()]'))
console.log(b.console)
await b.close()
