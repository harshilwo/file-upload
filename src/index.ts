import express from "express";
import * as dotenv from "dotenv";
import router from "./router";
dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

app.use("/cabinet", router);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
