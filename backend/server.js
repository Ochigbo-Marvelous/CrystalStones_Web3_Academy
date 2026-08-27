const app = require("./src/app");
const config = require("./src/config");
const pool = require("./src/config/db");

const startServer = async () => {
  try {
    // Test database connection
    const connection = await pool.getConnection();
    console.log(" MySQL Database connected successfully");
    connection.release();

    app.listen(config.port, () => {
      console.log(
        ` Server running in ${config.nodeEnv} mode on port ${config.port}`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();