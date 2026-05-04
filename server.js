const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const cron = require("node-cron");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);

      console.log("> Initializing cron jobs...");

      // Import the ESM module dynamically
      import("./lib/server/automation.js").then((automation) => {
        // Run daily task list at 11:00 AM
        cron.schedule("0 11 * * *", async () => {
          console.log("[Cron] Running 11:00 AM Daily Task List Automation");
          try {
            const result = await automation.sendDailyTaskListEmail();
            console.log(`[Cron] Sent ${result.sent} emails`);
          } catch (error) {
            console.error("[Cron] Daily task list error:", error);
          }
        });

        // Run evening summary at 7:00 PM
        cron.schedule("0 19 * * *", async () => {
          console.log("[Cron] Running 7:00 PM Evening Summary Automation");
          try {
            const result = await automation.sendEveningSummaryEmail();
            console.log(`[Cron] Sent ${result.sent} emails`);
          } catch (error) {
            console.error("[Cron] Evening summary error:", error);
          }
        });

        console.log("> Cron jobs initialized (11 AM and 7 PM)");
      }).catch(err => {
        console.error("> Failed to load automation module for cron jobs:", err);
      });
    });
});
