import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

const databaseId = "Chats";
const containerId = "history";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log(req);
  let response: any = [];
  let status = 200;
  switch (req.method) {
    case "GET":
      if (
        req.params.user.split(".")[0] == req.headers["x-ms-client-principal-id"]
      ) {
        var offset = 0;
        var limit = 20;
        if ("offset" in req.query) offset = parseInt(req.query.offset);
        if ("limit" in req.query) limit = parseInt(req.query.limit);

        const client = new CosmosClient(process.env.cosmosDB_connection);
        const database = client.database(databaseId);
        const container = database.container(containerId);
        const user = req.params.user;
        const { resources: docs } = await container.items
          .query(
            `SELECT * FROM c WHERE c.user = "${user}" ORDER BY c.date DESC OFFSET ${offset} LIMIT ${limit}`
          )
          .fetchAll();
        docs.sort((a, b) => {
          return a.date > b.date ? 1 : -1;
        });
        // context.log(docs);
        response = docs;
        // context.log(response);
        // {
        //     "name": "historyDocs",
        //     "type": "cosmosDB",
        //     "databaseName": "Chats",
        //     "collectionName": "history",
        //     "createIfNotExists": true,
        //     "partitionKey": "/user",
        //     "connectionStringSetting": "cosmosDB_connection",
        //     "direction": "in",
        //     "sqlQuery": "SELECT * FROM c WHERE c.user = {user}"
        // }
      }
      break;
    case "POST":
      // If in req.body there is an id, a user, and messages, the save to context.bindings.historyOutput
      if (req.body.user && req.body.messages) {
        const client = new CosmosClient(process.env.cosmosDB_connection);
        const database = client.database(databaseId);
        const container = database.container(containerId);
        var doc = null;
        req.body.date = new Date().toISOString();
        // console.log(doc);
        if (!req.body.id) {
          console.log("Creating new document");
          doc = await container.items.create(req.body);
        } else {
          console.log("Replacing document");
          doc = await container.item(req.body.id).replace(req.body);
        }
        const generatedId = doc.resource.id;
        // console.log(`Generated ID: ${generatedId}`);
        response = doc.resource;
      }
      break;
    case "DELETE":
      context.log(`Deleting ${req.params.id}`);
      if (
        req.params.id &&
        req.params.user.split(".")[0] == req.headers["x-ms-client-principal-id"]
      ) {
        context.log(`Deleting ${req.params.id}`);
        const client = new CosmosClient(process.env.cosmosDB_connection);
        const database = client.database(databaseId);
        const container = database.container(containerId);
        context.log("Getting document")
        const item = await container.item(req.params.id, req.params.user);
        context.log("Deleting document")
        const doc = await item.delete();
        if (doc.statusCode === 204) {
          status = 200;
          context.log("Document deleted successfully");
        } else {
          context.log("Failed to delete document");
        }
        context.log("Document deleted")
        response = { id: req.params.id, deleted: true, doc: doc.item.id };
        context.log(response);
      }
      break;
    default:
      break;
  }

  context.res = {
    status: status, /* Defaults to 200 */
    body: response,
  };
};

export default httpTrigger;
