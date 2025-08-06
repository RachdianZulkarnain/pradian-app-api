import { Request, Response } from "express";
import { VoucherService } from "./voucher.service";
import { CreateVoucherDTO } from "./dto/create-voucher.dto";
import { GetVouchersDTO } from "./dto/get-vouchers.dto";

export class VoucherController {
  private voucherService = new VoucherService();

  getVouchers = async (req: Request, res: Response) => {
    const query = req.query as unknown as GetVouchersDTO;
    const result = await this.voucherService.getVouchers(query);
    res.status(200).send(result);
  };

  getVouchersByEvent = async (req: Request, res: Response) => {
    try {
      const eventId = Number(req.params.eventId);

      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }

      const vouchers = await this.voucherService.getVouchersByEvent(eventId);

      res.status(200).json({ data: vouchers });
    } catch (error) {
      console.error("Failed to fetch vouchers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  createVoucher = async (req: Request, res: Response) => {
    const authUserId = res.locals.user.id;
    const body = req.body as CreateVoucherDTO;
    const result = await this.voucherService.createVoucher(body, authUserId);
    res.status(201).send(result);
  };
}
