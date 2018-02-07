# 微博定时爬虫
>Node爬虫获取用户的最新微博信息,并且对比是否更新，更新了则发送邮件
npm i
启动
npm test或者node index.js
修改config配置项即可

```json
{
  "service": "qq", //请去nodemailer 模块查找你的邮件服务商简写,网易不支持...
  "user": "370732889@qq.com",//发送邮箱,发信人邮箱
  "to": "370732889@qq.com",//接受邮箱,建议一致避免被block
  "pass": "",//qq邮箱是使用授权码
  "uid": 1078007814  // 微博用户的uid 请f12控制台查看一下
}
```