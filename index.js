let request = require('superagent');
let cheerio = require('cheerio');
let nodemailer = require('nodemailer');
let schedule = require('node-schedule');
let oldVal;
let newVal;
//配置信息
//user 用户发送邮件邮箱
//pass用户发送邮箱授权码
//to 接收邮件邮箱
//uid 新浪uid
//ms 一般不用改
let config = {
    user: '370732889@qq.com',
    pass: 'vqclhcsdudqcxcxbaxf',
    to: 'bless@unliar.com',
    uid: 1078007814,
    ms: 10
}
let transport = nodemailer.createTransport({
    service: 'qq',
    auth: {
        user: config.user,
        pass: config.pass
    }
});
//邮件发送配置选项
var options = {
    from: config.user,
    to: config.to,
    subject: '你的关注人有新微博啦！',
    text: 'Hello,  This is From Node!'
};

function requestUrl(uid) {

    //获得微博信息
    return request.get(`http://service.weibo.com/widget/widget_blog.php?uid=${uid}`).then((res) => {
        var $ = cheerio.load(res.text);
        //内容
        var msgcontent = [];
        $('.wgtCell .wgtCell_con').each(function (index, dom) {
            var msg = {};
            msg.inner = $(this).find('.wgtCell_txt').text();
            msg.timer = $(this).find('.wgtCell_tm').text();
            msg.link = $(this).find('.wgtCell_tm a').attr('href');
            msgcontent.push(msg);

        });
        return msgcontent
    })

};
//获取任务启动时初始微博
requestUrl(config.uid).then(res => { oldVal = res[0].inner }).catch((e) => { console.log(e) });
(function tasks() {
    //定时任务获取新微博
    schedule.scheduleJob({ second: config.ms }, () => {

        console.log('任务运行于：' + new Date());

        requestUrl(config.uid).then(res => {
            //获得最新微博并且于初始值比对
            newVal = res[0].inner;
            console.log(newVal, oldVal)
            if (oldVal != newVal) {
                //修改发送邮件配置项
                options.html = `<p>你关注人发了微博,点击红字查看！<hr><a style="color:red" href=${res[0].link}>${newVal}于： ${res[0].timer}'</a></p>`;
                transport.sendMail(options, function (error, info) {
                    if (error) {
                        console.log('发送失败！' + error)
                    } else {
                        console.log('发送成功！' + config.to);
                    }
                });
                oldVal = newVal;

            } else {
                console.log('微博未更新！')
            }
        }).catch((e) => { console.log(e) });

    })
}())


