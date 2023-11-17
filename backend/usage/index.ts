import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

const databaseId = "Chats";
const containerId = "usage";

const httpTrigger: AzureFunction = async function (
    context: Context,
    req: HttpRequest
): Promise<void> {
    const user = req.params.user;
    let range = null;

    if (range == null) {
        range = "mtd";
    }
    const client = new CosmosClient(process.env.cosmosDB_connection);
    const database = client.database(databaseId);
    const container = database.container(containerId);
    const sprocId = "getTotalTokensSumForUserAndCurrentMonth";
    const result = await container.scripts
        .storedProcedure(sprocId)
        .execute(user, [user]);
    context.log(user);
    context.log(result);
    context.res = {
        // status: 200, /* Defaults to 200 */
        body: result,
    };
};

export default httpTrigger;
