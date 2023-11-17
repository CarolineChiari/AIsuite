import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { BlobSASPermissions, BlobServiceClient } from "@azure/storage-blob";
import axios from "axios";
import { PassThrough } from "stream";

import { BlobGenerateSasUrlOptions } from "@azure/storage-blob";
import {
  ChatCompletionRequestMessageRoleEnum,
  Configuration,
  OpenAIApi,
} from "openai";

const databaseId = "Speech";
const containerId = "tts";
const usage_databaseId = "Chats";
const usage_containerId = "usage";
const embedding_model = "text-embedding-ada-002";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const speechKey = process.env.SPEECH_KEY;
  const speechRegion = process.env.SPEECH_REGION;

  const user = req.headers["x-ms-client-principal-id"]
    ? req.headers["x-ms-client-principal-id"]
    : "anonymous";

  const client = new CosmosClient(process.env.cosmosDB_connection);
  const database = client.database(databaseId);
  const container = database.container(containerId);
  const usage_database = client.database(usage_databaseId);
  const usage_container = usage_database.container(usage_containerId);

  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );
  const containerClient = blobServiceClient.getContainerClient("tts");
  switch (req.method) {
    case "GET":
      var offset = 0;
      var limit = 20;
      if ("offset" in req.query) offset = parseInt(req.query.offset);
      if ("limit" in req.query) limit = parseInt(req.query.limit);
      const { resources: docs } = await container.items
        .query(
          `SELECT * FROM c WHERE c.user = "${user}" ORDER BY c.date DESC OFFSET ${offset} LIMIT ${limit}`
        )
        .fetchAll();
      docs.sort((a, b) => {
        return a.date > b.date ? 1 : -1;
      });
      context.res = {
        status: 200,
        body: docs,
      };
      break;
    case "POST":
      var text = req.body.text.trim();
      const query = `SELECT * FROM c WHERE c.user = "${user}" AND c.text = "${text.replace(
        /"/g,
        "''"
      )}"`;
      var items: any[] = [];
      try {
        const { resources: docs } = await container.items
          .query(
            `SELECT * FROM c WHERE c.user = "${user}" AND c.text = "${text.replace(
              /"/g,
              "''"
            )}"`
          )
          .fetchAll();
        items = docs;
      } catch (error) {
        context.res = {
          status: 500,
          body: { error: error },
        };
        break;
      }
      if (items.length >= 1) {
        const item = items[0];
        const url = item.url;
        const parts = url.split("/");

        const lastElement = parts[parts.length - 1];
        const blockBlobClient = containerClient.getBlockBlobClient(lastElement);
        const sasOptions: BlobGenerateSasUrlOptions = {
          permissions: BlobSASPermissions.parse("r"),
          expiresOn: new Date(new Date().valueOf() + 86400),
        };
        var sasUrl: any = "nope";
        try {
          sasUrl = await blockBlobClient.generateSasUrl(sasOptions);
        } catch (error) {
          sasUrl = error;
        }
        context.log(sasUrl);
        context.res = {
          status: 200,
          body: { sasUrl: sasUrl },
        };
      } else {
        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
          speechKey,
          speechRegion
        );
        speechConfig.speechSynthesisLanguage = req.body.language;
        //   const speechConfig = SpeechSDK.SpeechConfig(speechKey, speechRegion);
        const filename = Math.random().toString(36);

        //   const audioConfig = SpeechSDK.AudioConfig.fromAudioFileOutput(`${filename}.mp3`)
        //   const audioConfig = SpeechSDK.AudioConfig.fromStreamOutput()
        const audioConfig = null;
        const speech =
          SpeechSDK.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
        const synthesizer = new SpeechSDK.SpeechSynthesizer(
          speechConfig
          // audioConfig
        );
        // const text = req.body.text;
        //   const ssmlDoc = new DOMParser().parseFromString(ssml, "text/xml");
        //   const text = ssmlDoc.getElementsByTagName("speak")[0].textContent;

        const bufferStream = new PassThrough();
        const result = await synthesizer.speakTextAsync(
          text,
          (result) => {
            context.log("84");
            const { audioData } = result;

            synthesizer.close();

            // convert arrayBuffer to stream

            bufferStream.end(Buffer.from(audioData));
            return bufferStream;
          },
          (error) => {
            context.log(112);
            context.log(error);
            synthesizer.close();
            context.res = {
              status: 500,
              body: { msg: "error" },
            };
          }
        );
        const blob = result;

        const blobName = `${filename}.mp3`;
        context.log(blobName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // pipe the PassThrough stream to the BlockBlobClient upload method
        const blobResponse = await blockBlobClient.uploadStream(bufferStream);
        const blobProperties = await blockBlobClient.getProperties();
        const URL = blockBlobClient.url;
        delete blobProperties._response;

        // Get the embeddings
        const configuration = new Configuration({
          apiKey: process.env.OPENAI_KEY,
        });
        const openai = new OpenAIApi(configuration);
        const embedding = await openai.createEmbedding({
          input: req.body.text,
          model: embedding_model,
        });

        var inputCost = 0.0001;
        var outputCost = 0.0001;
        const tokens = embedding.data.usage.total_tokens;
        const usage = {
          user: req.headers["x-ms-client-principal-id"],
          date: new Date(),
          usage: tokens,
          model: embedding_model,
          cost: (tokens * inputCost) / 1000,
        };
        usage_container.items.create(usage);
        var output = {
          url: URL,
          blob: blobResponse,
          properties: blobProperties,
          text: text,
          user: user,
          result: result,
          language: req.body.language,
          embedding: embedding.data.data[0].embedding,
        };
        context.log(output);

        const outputProperties = output;
        const doc = await container.items.create(outputProperties);

        const blockBlobClientReturn =
          containerClient.getBlockBlobClient(blobName);
        const sasOptions: BlobGenerateSasUrlOptions = {
          permissions: BlobSASPermissions.parse("r"),
          expiresOn: new Date(new Date().valueOf() + 86400),
        };
        context.log(176);
        const sasUrl = await blockBlobClientReturn.generateSasUrl(sasOptions);
        context.res = {
          status: 200,
          body: { sasUrl: sasUrl },
        };
        // doc.item.id
        // context.res = {
        //   status: 200,
        //   body: {
        //     token: tokenResponse.data,
        //     region: speechRegion,
        //     usageId: doc.item.id,
        //   },
        // };
      }
      // convert text to speech and save to file in blob storage

      break;
    case "DELETE":
      context.log("Deleting");
      if (
        (req.params?.id || req.body?.id || req.query?.id) &&
        (req.params?.language || req.body?.language || req.query?.language)
      ) {
        context.log("Deleting");
        const id = req.params?.id
          ? req.params.id
          : req.body?.id
          ? req.body.id
          : req.query.id;
        const language = req.params?.language
          ? req.params.language
          : req.body?.language
          ? req.body.language
          : req.query.language;
        context.log(`Deleting ${id}`);
        const item = await container.item(id, language).read();
        // context.log(item.item);
        if (item.statusCode === 200) {
          context.log(item.item.url.split("/").pop());
          const blockBlobClient = containerClient.getBlockBlobClient(item.item.url.split("/").pop());
          await blockBlobClient.delete();
          const doc = await container.item(id, language).delete();
          context.log(doc);
          if (doc.statusCode === 204) {
            context.res = {
              status: 200,
              body: { id: req.params.id, deleted: true, doc: doc.item.id },
            };
          } else {
            context.res = {
              status: 500,
              body: { id: req.params.id, deleted: false, doc: doc.item.id },
            };
          }
        } else {
          context.res = {
            status: 404,
            body: { id: id, deleted: false, doc: "Object not found" },
          };
        }
      } else {
        context.log("No id provided");
        context.log(req);
        context.res = {
          status: 501,
          body: {
            id: req.params.id,
            deleted: false,
            doc: "No id or language provided",
          },
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
