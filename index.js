let request = require('superagent');
let cheerio = require('cheerio');
let nodemailer = require('nodemailer');
let schedule = require('node-schedule');
//修改uid='你要抓取的用户'
//UID获取可在想抓取的新浪微博用户首页查看源代码获得
let reqUrl = 'http://service.weibo.com/widget/widget_blog.php?uid=2747514424';
let oldVal;
let newVal;
//邮件服务器配置信息
//相关邮件服务器配置可在https://nodemailer.com/about/ 查看
let transport = nodemailer.createTransport({
    service: 'qq',
    auth: {
        user: '370732889@qq.com',
        pass: '密码'
    }
});
//邮件发送配置选项
let options = {
    from: '370732889@qq.com',
    to: 'bless@unliar.com',
    subject: '你的关注人有新微博啦！',
    text: 'Hello,  This is From Node!'
};



function requestUrl(url) {

    //获得微博信息
    return request.get(url).then((res) => {
        var $ = cheerio.load(res.text);
        //内容
        var msgcontent = [];
        $('.wgtCell .wgtCell_con').each(function(index, dom) {
            var msg = {};
            msg.inner = $(this).find('.wgtCell_txt').text();
            msg.timer = $(this).find('.wgtCell_tm').text();
            msgcontent.push(msg);

        });


        console.log('最新微博：' + msgcontent[0].inner + ':' + msgcontent[0].timer);
        return msgcontent
    })

};

function tasks(url, ms, to) {
	//url 完整请求地址
    //ms 每分钟第几秒开始任务
    //to 目标邮箱，接受邮件提醒的邮箱地址
    //获取任务启动时初始微博
    requestUrl(url).then(res => { oldVal = res[0].inner });

    //定时任务获取新微博
    schedule.scheduleJob({ second: ms }, () => {

        console.log('任务运行于：' + new Date());

        requestUrl(url).then(res => {
            //获得最新微博并且于初始值比对
            newVal = res[0].inner;
            if (oldVal != newVal) {
                //修改发送邮件配置项
                options.to = to;
                options.text = '你关注人发了微博：' + newVal + '于：' + res[0].timer;
                transport.sendMail(options, function(error, info) {
                    if (error) {
                        console.log('发送失败！' + error)
                    } else {
                        console.log('发送成功！' + to);
                        //发送邮件成功则重置初始微博
                        requestUrl(url).then(res => { oldVal = res[0].inner });
                    }
                })

            } else {
                console.log('微博未更新！')
            }


        });

    })


}
//启动

tasks(reqUrl, 10, 'bless@unliar.com')
