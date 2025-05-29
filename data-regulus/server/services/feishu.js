const axios = require('axios');

async function feishuPost(msg) {
  const headers = { "Content-type": "application/json", "charset": "utf-8" };
  let feishuMSG = {
    "msg_type": "post",
    "content": {
      "post": {
        "zh_cn": {
          "title": "Dominus-Warning",
          "content": [
            [
              {
                "tag": "text",
                "text": JSON.stringify(msg)
              }
            ]
          ]
        }
      }
    }
  }

  try {
    const response = await axios.post('https://open.feishu.cn/open-apis/bot/v2/hook/13c6f0f2-0a6c-454d-948c-2ca77e82cc1c', feishuMSG, { headers });
    console.log('MSG SEND SUCCESS:', response.data);
  } catch (error) {
    console.error('MSG SEND FAILED:', error);
  }
}

module.exports = {
  feishuPost
};
