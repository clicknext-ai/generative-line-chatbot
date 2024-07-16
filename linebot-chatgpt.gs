var channelToken = ""; // Line Token
var apiKey = ""; // ChatGPT API Key

// Reply Message to Line
function replyMsg(replyToken, mess, channelToken) {
  var url = "https://api.line.me/v2/bot/message/reply";
  var opt = {
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Authorization: "Bearer " + channelToken,
    },
    method: "post",
    payload: JSON.stringify({
      replyToken: replyToken,
      messages: mess,
    }),
  };
  UrlFetchApp.fetch(url, opt);
}

// Get Message from Line and call chatGPT
function doPost(e) {
  var value = JSON.parse(e.postData.contents);
  var events = value.events;
  var event = events[0];
  var type = event.type;
  var replyToken = event.replyToken;

  switch (type) {
    // When user follow the bot
    case "follow":
      replyMsg(replyToken, mess, channelToken);
      break;

    // When user send message to the bot
    case "message":
      var messageType = event.message.type;
      if (messageType == "text") {
        call_chatgpt_text(event);
      } else if (messageType == "image") {
        call_chatgpt_image(event);
      } else {
        // Default message
        var mess = [{ type: "text", text: "Hello world" }];
        replyMsg(replyToken, mess, channelToken);
      }
      break;

    default:
      break;
  }
}

function call_chatgpt_text(event) {
  var userMessage = event.message.text;
  var replyToken = event.replyToken;
  var apiUrl = "https://api.openai.com/v1/chat/completions";
  var requestBody = {
    model: "gpt-3.5-turbo-0125", // or the model you want to use
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant."
      },
      {
        role: "user",
        content: userMessage
      }
    ],
    temperature: 0.9,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  };
  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "Bearer " + apiKey
    },
    payload: JSON.stringify(requestBody)
  };

  // Call chatGPT
  var response = UrlFetchApp.fetch(apiUrl, options);
  var responseData = JSON.parse(response.getContentText());
  var textResult = responseData.choices[0].message.content;
  var mess = [{ type: "text", text: textResult }];
  
  // Reply to Line user
  replyMsg(replyToken, mess, channelToken);
}


function call_chatgpt_image(event) {
  var messageId = event.message.id;
  var replyToken = event.replyToken;

  // Get image data
  var url = "https://api-data.line.me/v2/bot/message/" + messageId + "/content";
  var headers = {
    headers: { Authorization: "Bearer " + channelToken },
  };
  var getcontent = UrlFetchApp.fetch(url, headers);
  var imageBlob = getcontent.getBlob();
  var encodedImage = Utilities.base64Encode(imageBlob.getBytes());
  
  var apiUrl = "https://api.openai.com/v1/chat/completions";
  var payload = {
    model: "gpt-4-turbo", // or the model you want to use
    messages: [
      {
          role: 'user',
          content: [
            {
                type: 'text',
                text: "อธิบายรูปให้หน่อย"
            },
            {
                type: 'image_url',
                image_url: {
                  "url": "data:image/jpeg;base64,{" + encodedImage + "}"
                }
            }
          ]
      }
    ],
    temperature: 0.4,
    max_tokens: 4096
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "Bearer " + apiKey
    },
    payload: JSON.stringify(payload)
  };

  var response = UrlFetchApp.fetch(apiUrl, options);
  var responseData = JSON.parse(response.getContentText());
  var textResult = responseData.choices[0].message.content;
  var mess = [{ type: "text", text: textResult }];
  
  // Reply to Line user
  replyMsg(replyToken, mess, channelToken);
}

