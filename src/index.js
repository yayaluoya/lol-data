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
      let imgsDir = path.join(__dirname, `../dist/__所有英雄皮肤`);
      let audioDir = path.join(__dirname, `../dist/__所有英雄音效`);
      fs.mkdirSync(dir, {
        recursive: true,
      });
      fs.mkdirSync(imgsDir, {
        recursive: true,
      });
      fs.mkdirSync(audioDir, {
        recursive: true,
      });
      /**
       * 音效
       */
      await requst(selectAudio).then((res) => {
        fs.writeFileSync(
          path.join(dir, `选择音效${path.extname(selectAudio)}`),
          res
        );
        fs.writeFileSync(
          path.join(
            audioDir,
            `${`${name}-${title}`.replace(/\s+/g, "_")}选择音效${path.extname(
              selectAudio
            )}`
          ),
          res
        );
        console.log("选择音效下载完成");
      });
      await requst(banAudio).then((res) => {
        fs.writeFileSync(
          path.join(dir, `禁用音效${path.extname(banAudio)}`),
          res
        );
        fs.writeFileSync(
          path.join(
            audioDir,
            `${`${name}-${title}`.replace(/\s+/g, "_")}禁用音效${path.extname(
              banAudio
            )}`
          ),
          res
        );
        console.log("禁用音效下载完成");
      });
      /**
       * 皮肤
       */
      let info = await requst(
        `https://game.gtimg.cn/images/lol/act/img/js/hero/${heroId}.js?ts=2826469`
      ).then((res) => JSON.parse(res.toString()));
      fs.writeFileSync(
        path.join(dir, "info.json"),
        JSON.stringify(info, undefined, 4)
      );
      for (let { name, mainImg } of info.skins) {
        if (!mainImg) {
          continue;
        }
        // console.log(mainImg);
        await requst(mainImg)
          .then((res) => {
            let fileName = `${name
              .replace(/\s+/g, "_")
              .replace(/\//g, "")}${path.extname(mainImg)}`;
            fs.writeFileSync(path.join(dir, fileName), res);
            fs.writeFileSync(path.join(imgsDir, fileName), res);
            console.log(name, "皮肤下载完成");
          })
          .catch((err) => {
            console.log("下载皮肤出错了", name, err);
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
