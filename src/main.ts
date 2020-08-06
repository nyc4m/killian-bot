import dotenv from 'dotenv'
import Telegraf  from 'telegraf'
import  {MenuTemplate, MenuMiddleware}from 'telegraf-inline-menu'
import fs from 'fs'
import {exec} from 'child_process'

dotenv.config()

const FILTERS = /\.(mp4|mkv)$/
const ROOT_DIR = process.env.FILES


async function main() {
    const bot = new Telegraf(process.env.TOKEN || "");
    const menu = new MenuTemplate(ctx => "Yo, c'est le template")
    const files = await fs.promises.readdir(ROOT_DIR)
    const videos = files.filter(file => file.match(FILTERS))

    videos.forEach((video, index) => {
        menu.interact(video, `file-${index}`,{
            do: async (ctx: any) => {
                exec(`vlc "${ROOT_DIR}/${video}" --fullscreen --sub-track English --audio-track 1 --aspect-ratio 16x9`,(err, stdout, stderr) => {
                    if(err) {
                        console.error(err)
                        console.error(`stderr: ${stderr}`)
                        return
                    }
                    console.log(stdout)
                })
                return false
            }
        })
    })

    const menuMiddleware = new MenuMiddleware('/', menu)
    bot.on('message', ctx => menuMiddleware.replyToContext(ctx))
    bot.use(menuMiddleware)
    bot.use()

    console.log("ça part")
    bot.launch()
}

main()
