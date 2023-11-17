import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import axios from "axios";

const databaseId = "Chats";
const containerId = "usage";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  switch (req.method) {
    case "GET":
      const speechKey = process.env.SPEECH_KEY;
      const speechRegion = process.env.SPEECH_REGION;

      const headers = {
        headers: {
          "Ocp-Apim-Subscription-Key": speechKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      };

      try {
        const tokenResponse = await axios.post(
          `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken?expiredTime=300`,
          null,
          headers
        );

        const client = new CosmosClient(process.env.cosmosDB_connection);
        const database = client.database(databaseId);
        const container = database.container(containerId);
        const usage = {
          user: req.headers["x-ms-client-principal-id"],
          date: new Date(),
          usage: 5,
          model: "speechToText",
          cost: 0.016,
        };
        const doc = await container.items.create(usage);
        // doc.item.id
        context.res = {
          status: 200,
          body: {
            token: tokenResponse.data,
            region: speechRegion,
            usageId: doc.item.id,
          },
        };
      } catch (err) {
        context.res = {
          status: 401 /* Defaults to 200 */,
          body: { msg: "error" },
        };
        // res.status(401).send('There was an error authorizing your speech key.');
      }
      break;
    case "POST":
      context.log(req.body);
      // find the document with the documentId and update the usage
      // req.body is {id: string, usage: number}
      const client = new CosmosClient(process.env.cosmosDB_connection);
      const database = client.database(databaseId);
      const container = database.container(containerId);
      const { resource: document } = await container
        .item(req.body.id, req.headers["x-ms-client-principal-id"])
        .read();

      document.usage = req.body.usage;
      context.log(document);
      const copiedDocument = JSON.parse(JSON.stringify(document));
      context.log(copiedDocument);
      try {
        const result = await container
          .item(req.body.id, req.headers["x-ms-client-principal-id"])
          .replace(copiedDocument);
        context.res = {
          status: 200,
          body: { result: result },
        };
      } catch (err) {
        context.log(err);
        context.res = {
          status: 501,
          body: { msg: "error" },
        };
      }
      break;
  }

  // context.log('HTTP trigger function processed a request.');
  // const name = (req.query.name || (req.body && req.body.name));
  // const responseMessage = name
  //     ? "Hello, " + name + ". This HTTP triggered function executed successfully."
  //     : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";
};

export default httpTrigger;
