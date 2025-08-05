import "reflect-metadata";
import express, { Express } from "express";
import cors from "cors";

import { PORT } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";

// Routers
import { AuthRouter } from "./modules/auth/auth.router";
import { EventRouter } from "./modules/events/event.router";
import { SampleRouter } from "./modules/sample/sample.router";
import { ProfileRouter } from "./modules/profile/profile.router";
import { TransactionRouter } from "./modules/transaction/transaction.router";
import { TicketRouter } from "./modules/tickets/ticket.router";
import { VoucherRouter } from "./modules/voucher/voucher.router";
import { SettingsRouter } from "./settings/settings.router";

// Scheduler
import { initializeScheduler } from "./scripts";

export class App {
  public app: Express;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.routes();
    this.handleError();
    initializeScheduler(); // Optional: Scheduled jobs
  }

  private configureMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private routes() {
    this.app.use("/samples", new SampleRouter().getRouter());
    this.app.use("/events", new EventRouter().getRouter());
    this.app.use("/auth", new AuthRouter().getRouter());
    this.app.use("/profile", new ProfileRouter().getRouter());
    this.app.use("/transactions", new TransactionRouter().getRouter());
    this.app.use("/tickets", new TicketRouter().getRouter());
    this.app.use("/vouchers", new VoucherRouter().getRouter());
    this.app.use("/settings", new SettingsRouter().getRouter());
  }

  private handleError() {
    this.app.use(errorMiddleware); // Global error handler
  }

  public start() {
    if (!PORT) {
      console.error("❌ PORT is not defined in environment variables.");
      process.exit(1);
    }

    this.app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  }
}
