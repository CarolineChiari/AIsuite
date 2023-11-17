import { CosmosClient } from "@azure/cosmos";
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { Configuration, OpenAIApi } from "openai";

const databaseId = "Chats";
const containerId = "usage";
const embedding_model = "text-embedding-ada-002";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_KEY,
  });
  const openai = new OpenAIApi(configuration);
  context.log(req.body.text);
  const result = await openai.createEmbedding({
    input: req.body.text,
    model: embedding_model,
  });
  context.log(result.data);
  var inputCost = 0.0001;
  var outputCost = 0.0001;
  const tokens = result.data.usage.total_tokens;
  const client = new CosmosClient(process.env.cosmosDB_connection);
  const database = client.database(databaseId);
  const container = database.container(containerId);
  const usage = {
    user: req.headers["x-ms-client-principal-id"] ? req.headers["x-ms-client-principal-id"] : "anonymous",
    date: new Date(),
    usage: tokens,
    model: embedding_model,
    cost: tokens * inputCost/1000,
  };
  const output = { embedding: result.data.data[0].embedding }
  container.items.create(usage);
  context.res = {
    status: 200,
    body: output,
  };
};

export default httpTrigger;
