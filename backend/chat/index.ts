import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import { Configuration, OpenAIApi } from "openai";
import { CosmosClient } from "@azure/cosmos";
import { error } from "console";

const databaseId = "Chats";
const containerId = "usage";
// "That model is currently overloaded with other requests. You can retry your request, or contact us through our help center at help.openai.com if the error persists. (Please include the request ID XXX in your message.)"
// status 429
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  console.log("here");
  // console.log(req)
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_KEY,
  });
  const openai = new OpenAIApi(configuration);
  // const key = process.env.OPENAI_KEY;
  const messages = req.body.messages;
  // console.log(messages);
  var completion: any = "IDK";
  var model = req.body.model;
  if (model == null) {
    model = "gpt-3.5-turbo-16k";
  }
  var cost = 0.03;
  var inputCost = 0.03;
  var outputCost = 0.06;
  switch (model) {
    case "gpt-3.5-turbo":
      inputCost = 0.0015;
      outputCost = 0.002;
      break;
    case "gpt-3.5-turbo-16k":
      inputCost = 0.003;
      outputCost = 0.004;
      break;
    case "gpt-4":
      inputCost = 0.03;
      outputCost = 0.06;
      break;
    case "gpt-4-32k":
      inputCost = 0.06;
      outputCost = 0.12;
      break;
  }
  try {
    // const model = "gpt-4";
    var tokens = {
      prompt_tokens: -1,
      completion_tokens: -1,
      total_tokens: 8000,
    };
    var errorResult = {
      error: "",
      status: 0,
    };
    try {
      const res = await openai.createChatCompletion({
        // model: "gpt-4",
        model: model,
        messages: messages,
        // user: req.headers['x-ms-client-principal-name']
      });
      tokens = res.data.usage;
      completion = res.data.choices[0].message;
      cost =
        (tokens.completion_tokens * outputCost +
          tokens.prompt_tokens * inputCost) /
        tokens.total_tokens;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
        completion = {
          error: error.response.data,
          status: error.response.status,
        };
      } else {
        console.log(error.message);
        completion = {
          error: error.message,
          status: 500,
        };
      }
    }

    const client = new CosmosClient(process.env.cosmosDB_connection);
    const database = client.database(databaseId);
    const container = database.container(containerId);
    const usage = {
      user: req.headers["x-ms-client-principal-id"],
      date: new Date(),
      usage: tokens,
      model: model,
      cost: cost,
    };
    const doc = await container.items.create(usage);
  } catch (e) {
    console.log(e);
    completion = {
      error: e,
      status: 500,
    };
  }
  context.res = {
    // status: 200, /* Defaults to 200 */
    body: completion,
  };
};

export default httpTrigger;
