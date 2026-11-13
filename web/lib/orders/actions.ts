"use server";

import { z } from "zod";
import { apiPost } from "@/lib/api";
import { actionClient } from "@/lib/shared";

const enqueueOrderSchema = z.object({
  accessToken: z.string().trim().optional(),
  orderId: z.string().trim().min(1, "orderId is required"),
});

export type EnqueueOrderResult = {
  accepted: boolean;
  jobId: string | null;
  orderId: string;
  queue: string;
  name: string;
};

/** Frontend → Gateway → WorkersService (.NET) enqueue scaffold. */
export const enqueueOrderAction = actionClient
  .inputSchema(enqueueOrderSchema)
  .action(async ({ parsedInput }): Promise<EnqueueOrderResult> => {
    return apiPost<EnqueueOrderResult>(
      "/api/orders/enqueue",
      { orderId: parsedInput.orderId },
      undefined,
      parsedInput.accessToken,
    );
  });
