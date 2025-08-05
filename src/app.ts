import "reflect-metadata";
import cors from "cors";
import express, { Express } from "express";
import { PORT } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";

import { AuthRouter } from "./modules/auth/auth.router";
import { EventRouter } from "./modules/events/event.router";
import { SampleRouter } from "./modules/sample/sample.router";
import { ProfileRouter } from "./modules/profile/profile.router";
import { TransactionRouter } from "./modules/transaction/transaction.router";
import { TicketRouter } from "./modules/tickets/ticket.router";
import { VoucherRouter } from "./modules/voucher/voucher.router";

import { initializeScheduler } from "./scripts";
import { SettingsRouter } from "./settings/settings.router";
import { AnalyticsRouter } from "./modules/analytics/analytics.router";

export class App {
  app: Express;

  constructor() {
    this.app = express();
    this.configure();
    this.routes();
    this.handleError();
    initializeScheduler();
  }

  private configure() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private routes() {
    const sampleRouter = new SampleRouter();
    const eventRouter = new EventRouter();
    const authRouter = new AuthRouter();
    const profileRouter = new ProfileRouter();
    const transactionRouter = new TransactionRouter();
    const ticketRouter = new TicketRouter();
    const voucherRouter = new VoucherRouter();
    const settingsRouter = new SettingsRouter();
    const analyticsRouter = new AnalyticsRouter();

    this.app.use("/samples", sampleRouter.getRouter());
    this.app.use("/events", eventRouter.getRouter());
    this.app.use("/auth", authRouter.getRouter());
    this.app.use("/profile", profileRouter.getRouter());
    this.app.use("/analytics", analyticsRouter.getRouter());
    this.app.use("/transactions", transactionRouter.getRouter());
    this.app.use("/tickets", ticketRouter.getRouter());
    this.app.use("/vouchers", voucherRouter.getRouter());
    this.app.use("/settings", settingsRouter.getRouter());
  }

  private handleError() {
    this.app.use(errorMiddleware);
  }

  public start() {
    this.app.listen(PORT, () => {
      console.log(`🚀 Server running on port: ${PORT}`);
    });
  }
}
