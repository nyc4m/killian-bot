import dotenv from 'dotenv'
import Telegraf from 'telegraf'
import { MenuTemplate, MenuMiddleware } from 'telegraf-inline-menu'
import fs from 'fs'
import { exec } from 'child_process'
import util, { log } from 'util'

const promisifiedExec = util.promisify(exec)

dotenv.config()

const FILTERS = /\.(mp4|mkv)$/
const ROOT_DIR = process.env.FILES || ''

const playFile = (rootDir: string, videoName: string) => {
  return promisifiedExec(
    `vlc "${rootDir}/${videoName}" --fullscreen --sub-track English --audio-track 1 --aspect-ratio 16x9`
  )
}

async function main() {
  const bot = new Telegraf(process.env.TOKEN || '')
  const menu = new MenuTemplate((ctx) => "Hi, here's your files")
  const files = await fs.promises.readdir(ROOT_DIR)
  const videos = files.filter((file) => file.match(FILTERS))

  videos.forEach((video, index) => {
    menu.interact(video, `file-${index}`, {
      do: async (ctx: any) => {
        playFile(ROOT_DIR, video).then(() =>
          fs.writeFile('./last.killian', video, (err) =>
            log(err?.message || '')
          )
        )
        return true
      },
    })
  })

  const menuMiddleware = new MenuMiddleware('/', menu)
  bot.on('message', async (ctx) => {
    const pendingProcess = menuMiddleware.replyToContext(ctx)
    const pendingFile = fs.promises.readFile('last.killian')
    await pendingProcess
    try {
      const lastVideo = (await pendingFile).toString('utf8')
      ctx.reply(`last video was : ${lastVideo}`)
    } catch (err) {
      console.error(err.message)
    }
  })
  bot.use(menuMiddleware)
  bot.use()

  console.log('ça part')
  bot.launch()
}

main()
