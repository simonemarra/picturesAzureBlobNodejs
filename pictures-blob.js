const { ContainerClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
const express = require("express");
const bodyParser = require("body-parser");
// Load the .env file if it exists
require("dotenv").config();

const app = express();
const port = 3001;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// add timestamps in front of log messages
require("console-stamp")(console, "yy-mm-dd,HH:MM:ss.l");

app.get("/", (req, res) => {
  res.send(`Hello World!`);
});

app.get("/picture/:filename", async (req, res) => {
  // console.log("GET picture");
  // console.log(`req.query > ${req.query}`);
  // console.log(`req.query['uid'] > ${req.query["uid"]}`);
  // console.log(`req.query['userid'] > ${req.query["userid"]}`);

  const blobFileName = req.params.filename; //`${req.query["uid"]}_${req.query["userid"]}`;
  console.log(`GET picture filename: ${blobFileName}`);

  const account = process.env.ACCOUNT_NAME || '';
  const accountKey = process.env.ACCOUNT_KEY || '';
  const containerName = process.env.CONTAINER_NAME || '';
  // Use StorageSharedKeyCredential with storage account and account key
  // StorageSharedKeyCredential is only available in Node.js runtime, not in browsers
  const sharedKeyCredential = new StorageSharedKeyCredential(
    account,
    accountKey
  );

  // Create a container
  const containerClient = new ContainerClient(
    `https://${account}.blob.core.windows.net/${containerName}`,
    sharedKeyCredential
  );

  // Downloading blob from the snapshot
  const blobName = blobFileName;
  const blobClient = containerClient.getBlobClient(blobName);
  // const blockBlobClient = blobClient.getBlockBlobClient();
  console.log("Downloading blob...");
  const snapshotResponse = await blobClient.createSnapshot();
  const blobSnapshotClient = blobClient.withSnapshot(snapshotResponse.snapshot);

  const response = await blobSnapshotClient.download(0);
  console.log(`Reading response length ${(await blobSnapshotClient.getProperties()).contentLength}`);
  // console.log(
  //   "Downloaded blob content",
  //   (await streamToBuffer(response.readableStreamBody)).toString()
  // );
  res.send(await streamToBuffer(response.readableStreamBody));
});

// A helper method used to read a Node.js readable stream into a Buffer
async function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on("error", reject);
  });
}

app.post("/picture", (req, res, next) => {
  console.log("proxyreq");
});

app.listen(port, () => {
  console.log(`picturesblobapisnodejs listening at http://localhost:${port}`);
});
