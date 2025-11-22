import 'dotenv/config';
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import directoryRoutes from "./routes/directoryRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import checkAuth from "./middlewares/authMiddleware.js";
import { connectDB } from "./config/db.js";
import { spawn } from "child_process";
import crypto from "crypto";

await connectDB();

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.json());

const whitelist = [process.env.CLIENT_URL_1, process.env.CLIENT_URL_2];

app.use(
  cors({
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.post("/github-webhook", (req, res) => {
  const givenSignature = req.headers["x-hub-signature-256"];
  if (!givenSignature) {
    return res.status(403).json({ error: "Invalid Signature" });
  }
  const calculatedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", process.env.GITHUB_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

  if (givenSignature !== calculatedSignature) {
    return res.status(403).json({ error: "Invalid Signature" });
  }

  res.json({ message: "OK" });

  let repository;
  if (req.body.repository.name === "stroageApp-frontend") {
    repository = "frontend";
  } else {
    repository = "backend";
  }

  console.log({ repository });

  const bashChildProcess = spawn("bash", [
    `/home/ubuntu/deploy-${repository}.sh`,
  ]);

  bashChildProcess.stdout.on("data", (data) => {
    process.stdout.write(data);
  });

  bashChildProcess.stderr.on("data", (data) => {
    process.stderr.write(data);
  });

  bashChildProcess.on("close", (code) => {
    if (code === 0) {
      console.log("Script executed successfully!");
    } else {
      console.log("Script failed!");
    }
  });

  bashChildProcess.on("error", (err) => {
    console.log("Error in spawning the process!");
    console.log(err);
  });
});

app.get("/", (req, res) => {
  res.json({ message: "Hello from StorageApp!" });
});

app.get("/err", (req, res) => {
  console.log("process exited with error");
  process.exit(1);
});

app.use("/directory", checkAuth, directoryRoutes);
app.use("/file", checkAuth, fileRoutes);
app.use("/subscriptions", checkAuth, subscriptionRoutes);
app.use("/webhooks", webhookRoutes);
app.use("/", userRoutes);
app.use("/auth", authRoutes);

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).json({ error: "Something went wrong!" });
  // res.json(err);
});

app.listen(PORT, () => {
  console.log(`Server Started`);
});
