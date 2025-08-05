// src/modules/bankDetails/bank-details.controller.ts
import { Request, Response } from "express";
import { BankDetailsService } from "./bank-details.service";
import { ApiError } from "../../utils/api-error";

export class BankDetailsController {
  private bankDetailsService: BankDetailsService;

  constructor() {
    this.bankDetailsService = new BankDetailsService();
  }

  // GET /bank-details
  getBankDetails = async (req: Request, res: Response) => {
    const userId = res.locals.user?.id;
    if (!userId) throw new ApiError("Unauthorized", 401);

    const result = await this.bankDetailsService.getBankDetails(userId);
    res.status(200).send(result || null);
  };

  // POST /bank-details
  upsertBankDetails = async (req: Request, res: Response) => {
    const userId = res.locals.user?.id;
    if (!userId) throw new ApiError("Unauthorized", 401);

    const { bankName, accountName, accountNumber } = req.body;

    if (!bankName || !accountName || !accountNumber) {
      throw new ApiError("All fields are required", 400);
    }

    const result = await this.bankDetailsService.upsertBankDetails(userId, {
      bankName,
      accountName,
      accountNumber,
    });

    res.status(200).send({ message: "Bank details saved", data: result });
  };
}
