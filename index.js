const request = require('superagent')
const cheerio = require('cheerio')
const nodemailer = require('nodemailer')
const schedule = require('node-schedule')
const Events = require('events')
const listener = new Events()
const { service, user, pass, uid, to } = require('./config.json')
/**
 * 历史微博
 */
let preWeibo = {
  main: null,
  time: null,
  link: null
}
/**
 * 监听新微博
 */
listener.on('weibo', weibo => {
  const mailServer = createMailServer(service, user, pass)
  const subject = `你关注的用户有新微博了,${new Date()}`
  const html = `<p>你关注人发了微博,点击红字查看！<hr><a style="color:red" href=${weibo.link}>${weibo.inner}于： ${weibo.timer}'</a></p>`
  try {
    /**发送邮件成功 */
    sendMail(mailServer, user, to, subject, html).then(() => {
      /**重置数据 */
      preWeibo = weibo
    })
  } catch (error) {
    console.log(error)
  }

})

/**
 * 创建一个邮件服务
 * 
 * @param {string} service - 邮箱服务提供商,具体查看nodemailer模块 
 * @param {string} user - 邮箱
 * @param {string} pass - 密码
 */
const createMailServer = (service, user, pass) => {
  const mailServer = nodemailer.createTransport({
    service: service,
    auth: {
      user: user,
      pass: pass
    }
  })
  return mailServer
}

/**
 * 发送邮件
 * 
 * @param {object} mailServer - 邮件服务
 * @param {string} from - 发件人填创建邮件服务的人
 * @param {string} to - 收件人
 * @param {string} subject - 邮件主题
 * @param {string} html - 邮件正文
 */
const sendMail = (mailServer, from, to, subject, html) => {
  return new Promise((resolve, reject) => {
    mailServer.sendMail({
      from,
      to,
      subject,
      html
    }, err => {
      if (err) {
        console.log('邮件发送出错')
        reject(err)
      } else {
        console.log('邮件发送成功')
        resolve(true)
      }
    })
  })
}

/**
 * 获取最新数据
 * 
 * @param {number} - uid 用户的pid,请自行F12查看
 */

const getLatestWeibo = async uid => {
  try {
    const { text } = await request.get(`http://service.weibo.com/widget/widget_blog.php?uid=${uid}`)
    const $ = cheerio.load(text)
    const latestWeibo = $('.wgtCell .wgtCell_con').first()
    console.log('获取新微博成功')
    return {
      main: latestWeibo.find('.wgtCell_txt').text(),
      time: latestWeibo.find('.wgtCell_tm').text(),
      link: latestWeibo.find('.wgtCell_tm a').attr('href')
    }
  } catch (error) {
    console.log("获取最新weibo失败", error)
    return null
  }

}

/**
 * 对比微博数据
 * 
 * @param {string} preWeibo - 旧微博 
 * @param {string} newWeibo - 新微博
 */
const dataDiff = (preWeibo, newWeibo) => {
  /**
   * 如果旧微博无数据=未初始化
   * 如果新微博无数据=数据请求失败
   * diff失败
   */
  if (!preWeibo.link === true || !newWeibo.link === true) {
    console.log('当前用户微博无数据')
    return false
  }
  /**
   * 判断微博主体内容是否相同
   * 相同则说明微博没更新
   */
  if (preWeibo.link === newWeibo.link) {
    console.log('当前用户微博无新数据')
    return false
  } else {
    console.log('发现新微博')
    return true
  }

}

/**
 * 定时任务
 */
schedule.scheduleJob({
  second: 10
}, async () => {
  /**获取数据 */
  const weiboData = await getLatestWeibo(uid)
  /**对比数据 */
  const diffResult = dataDiff(preWeibo, weiboData)
  /**如果数据存在差异,激活微博事件 */
  if (!diffResult === false) {
    console.log('尝试发送邮件')
    listener.emit('weibo', weiboData)
  } else {
    console.log('当前用户微博无更新')
  }
})