const https = require("https");
const path = require("path");
const fs = require("fs");

requst(
  "https://game.gtimg.cn/images/lol/act/img/js/heroList/hero_list.js?ts=2826465"
)
  .then(async (res) => {
    let str = res.toString();
    let heros = JSON.parse(str).hero;
    console.log("开始爬取共", heros.length, "位英雄");
    for (let i in heros) {
      i = parseInt(i);
      const { heroId, name, title, selectAudio, banAudio, keywords } = heros[i];
      console.log(`开始爬取 ${name}-${title} 的资料`);
      let dir = path.join(
        __dirname,
        `../dist/${name}-${title}`.replace(/\s+/g, "_")
      );
      fs.mkdirSync(dir, {
        recursive: true,
      });
      /**
       * 音效
       */
      console.log("下载音效");
      await requst(selectAudio).then((res) => {
        fs.writeFileSync(
          path.join(dir, `选择音效${path.extname(selectAudio)}`),
          res
        );
      });
      await requst(banAudio).then((res) => {
        fs.writeFileSync(
          path.join(dir, `禁用音效${path.extname(banAudio)}`),
          res
        );
      });
      /**
       * 皮肤
       */
      console.log("下载皮肤");
      let info = await requst(
        `https://game.gtimg.cn/images/lol/act/img/js/hero/${heroId}.js?ts=2826469`
      ).then((res) => JSON.parse(res.toString()));
      fs.writeFileSync(
        path.join(dir, "info.json"),
        JSON.stringify(info, undefined, 4)
      );
      for (let { name, mainImg } of info.skins) {
        if (!mainImg) {
          break;
        }
        await requst(mainImg).then((res) => {
          fs.writeFileSync(
            path.join(
              dir,
              `${name.replace(/\s+/g, "_").replace(/\//g, "")}${path.extname(
                mainImg
              )}`
            ),
            res
          );
        });
      }
      console.log(
        `第${i + 1}个英雄 ${name}-${title} 资料爬取完成 还剩下${
          heros.length - i - 1
        }个英雄`
      );
    }
  })
  .catch((err) => {
    console.log("出错了", err);
  });

function requst(url) {
  return new Promise((res, rej) => {
    let req = https.request(url, (mes) => {
      let s = Buffer.from([]);
      mes.addListener("data", (d) => {
        s = Buffer.concat([s, d], s.length + d.length);
      });
      mes.addListener("end", () => {
        res(s);
      });
    });
    req.end();
    req.addListener("error", (err) => {
      rej(err);
    });
  });
}
