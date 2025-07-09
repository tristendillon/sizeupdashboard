import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { DispatchTypesSchema } from "@sizeupdashboard/convex/api/schema";
import { api } from "@sizeupdashboard/convex/api/_generated/api";

export const customizationRouter = createTRPCRouter({
  createDispatchType: publicProcedure
    .input(z.object({ dispatchTypes: z.array(DispatchTypesSchema) }))
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.db.mutation(
        api.customization.createDispatchType,
        input,
      );
      return result;
    }),
});
