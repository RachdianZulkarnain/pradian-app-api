import cors from "cors";
import express, { Express } from "express";
import "reflect-metadata";

import { PORT } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";

import { AnalyticsRouter } from "./modules/analytics/analytics.router";
import { AuthRouter } from "./modules/auth/auth.router";
import { BankDetailsRouter } from "./modules/bank-details/bank-details.router";
import { EventRouter } from "./modules/events/event.router";
import { ProfileRouter } from "./modules/profile/profile.router";
import { ReviewRouter } from "./modules/reviews/review.router";
import { TicketRouter } from "./modules/tickets/ticket.router";
import { TransactionRouter } from "./modules/transaction/transaction.router";
import { VoucherRouter } from "./modules/voucher/voucher.router";
import { initializeScheduler } from "./scripts";
import { SettingsRouter } from "./settings/settings.router";
import { initializeWorkers } from "./workers";

export class App {
  public app: Express;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.routes();
    this.handleError();
    initializeScheduler();
    initializeWorkers();
  }

  private configureMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private routes() {
    const eventRouter = new EventRouter();
    const authRouter = new AuthRouter();
    const profileRouter = new ProfileRouter();
    const transactionRouter = new TransactionRouter();
    const ticketRouter = new TicketRouter();
    const voucherRouter = new VoucherRouter();
    const settingsRouter = new SettingsRouter();
    const bankDetailsRouter = new BankDetailsRouter();
    const analyticsRouter = new AnalyticsRouter();
    const reviewRouter = new ReviewRouter();

    this.app.use("/events", eventRouter.getRouter());
    this.app.use("/auth", authRouter.getRouter());
    this.app.use("/profile", profileRouter.getRouter());
    this.app.use("/analytics", analyticsRouter.getRouter());
    this.app.use("/transactions", transactionRouter.getRouter());
    this.app.use("/tickets", ticketRouter.getRouter());
    this.app.use("/vouchers", voucherRouter.getRouter());
    this.app.use("/settings", settingsRouter.getRouter());
    this.app.use("/bank-details", bankDetailsRouter.getRouter());
    this.app.use("/reviews", reviewRouter.getRouter());
  }

  private handleError() {
    this.app.use(errorMiddleware);
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
