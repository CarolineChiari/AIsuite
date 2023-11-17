import { CosmosClient } from "@azure/cosmos";
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { profile } from "console";

const databaseId = "Profiles";

const default_profile = {};
  const default_settings = {
    theme: "dark",
    user: "",
    chat: {
      default_prompt: "You are a helpful, creative, clever, and very friendly.",
    },
  };

function validateSettings(settings:any):boolean {

  return true;
}


const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  var statusCode = 500;
  var responseMessage: any = { message: "Something went wrong" };

  const client = new CosmosClient(process.env.cosmosDB_connection);
  const database = client.database(databaseId);

  const profiles_container = database.container("profiles");
  const settings_container = database.container("settings");
  const usage_container = database.container("usages");

  

  const user = req.headers["x-ms-client-principal-id"];
  if (user) {
    switch (req.query.type) {
      case "profile":
        const { resources: profile } = await profiles_container.items
          .query(`SELECT * FROM c WHERE c.user = "${user}"`)
          .fetchAll();
        if (req.method == "GET") {
          if (profile.length > 0) {
            responseMessage = profile[0];
          } else {
            responseMessage = default_profile;
          }
        } else if (req.method == "POST") {
        }
        break;
      case "settings":
        const { resources: settings } = await settings_container.items
          .query(`SELECT * FROM c WHERE c.user = "${user}"`)
          .fetchAll();
        if (req.method == "GET") {
          if (settings.length > 0) {
            responseMessage = settings[0];
          } else {
            context.log("Creating default settings")
            default_settings.user = user;
            const res = await settings_container.items.create(default_settings);
            responseMessage = default_settings;
          }
          statusCode = 200;
        } else if (req.method == "POST") {
            context.log(req.body)
            const {resource: setting} = await settings_container.items.upsert(req.body);
            responseMessage = setting;
            statusCode = 200;
        }
        break;
      case "usage":
        break;
      default:
        break;
    }
  }
  req.query.type;

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: responseMessage,
  };
};

export default httpTrigger;
