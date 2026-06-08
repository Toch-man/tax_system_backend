import dotenv from "dotenv";

import connectDB from "./config/database.js";
import app from "./app.js";
dotenv.config();

const PORT = process.env.PORT;

const startServer = async () => {
  try {
    await connectDB(); // Connect to the database before starting the server

    app.listen(PORT, () => {
      console.log(
        `Server is running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error
    );

    process.exit(1); // Exit with failure code
  }
};

startServer(); // Start the server and connect to the database