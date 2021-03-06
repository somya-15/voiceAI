const dasha = require("@dasha.ai/sdk");
const { v4: uuidv4 } = require("uuid");
const express = require("express");
const cors = require("cors");

const expressApp = express();
expressApp.use(express.json());
expressApp.use(cors());

const axios = require("axios").default;

const main = async () => {
  const app = await dasha.deploy(`${__dirname}/app`);

  app.setExternal("confirm", async(args, conv) => {
      console.log("collected fruit is " + args.fruit);

      const res = await axios.post( "http://ptsv2.com/t/dasha-test/post");
      console.log(" JSON data from API ==>", res.data);

      const receivedFruit = res.data.favoriteFruit;
      console.log("fruit is  ==>", receivedFruit);

    if (args.fruit == receivedFruit)
      return true;
    else 
      return false; 
  });

// External function check status 
  app.setExternal("status", async(args, conv) => {

    const res = await axios.post( "http://ptsv2.com/t/dasha-test/post");
    console.log(" JSON data from API ==>", res.data);

    const receivedFruit = res.data.favoriteFruit;
    console.log("status is  ==>", res.data.status);

    if (res.data.status = "approved")
    return("Congratulations, Ms. Somya Tomar your identity is successfully confirmed. From contemporary yoga classes to trendy new diets, you seems to be on the hunt for the next big thing for your health and wellness. Ask me anything that would you like to know about Yoga, Exercise, Health, Diet or discuss mental health issues. Don't be shy, I am here to help you. Also, I see that your medical background section mentions that you have struggles with thyroid. Do checkout our Yoga for Abdomen or Neck Stretch. Coming back to the topic, feel free to let me know your queries!"); 
    else 
    return("Apologies, Ms. Somya Tomar, Your application is not approved. ");
  });

  await app.start({ concurrency: 10 });

  expressApp.get("/sip", async (req, res) => {
    const domain = app.account.server.replace("app.", "sip.");
    const endpoint = `wss://${domain}/sip/connect`;

    // client sip address should:
    // 1. start with `sip:reg`
    // 2.  be unique
    // 3. use the domain as the sip server
    const aor = `sip:reg-${uuidv4()}@${domain}`;

    res.send({ aor, endpoint });
  });

  expressApp.post("/call", async (req, res) => {
    const { aor, name } = req.body;
    res.sendStatus(200);

    console.log("Start call for", req.body);
    const conv = app.createConversation({ endpoint: aor, name });
    conv.on("transcription", console.log);
    conv.audio.tts = "dasha";
    conv.audio.noiseVolume = 0;

    await conv.execute();
  });

  const server = expressApp.listen(8000, () => {
    console.log("Api started on port 8000.");
  });

  process.on("SIGINT", () => server.close());
  server.once("close", async () => {
    await app.stop();
    app.dispose();
  });
};

main();
