import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import router from "./router";
dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// Allow specific origins
app.use(
  cors({
    origin: ["http://localhost:5000"], // Frontend origin
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// OR allow all origins (for local testing)
app.use(cors());

app.use("/api", router);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
