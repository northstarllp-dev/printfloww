import { z } from "zod";
import { allowedMimeTypes } from "./file-rules";

export const customerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid Indian mobile number"),
  email: z.string().trim().email().optional().or(z.literal(""))
});

export const fileMetadataSchema = z.object({
  id: z.string().uuid(),
  originalName: z.string().min(1).max(255),
  storagePath: z.string().min(1),
  mimeType: z.enum(allowedMimeTypes),
  sizeBytes: z.number().int().positive().max(50 * 1024 * 1024),
  pageCount: z.number().int().positive().nullable()
});

export const uploadIntentSchema = customerSchema.extend({
  files: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        mimeType: z.enum(allowedMimeTypes),
        sizeBytes: z.number().int().positive().max(50 * 1024 * 1024)
      })
    )
    .min(1)
    .max(10)
    .refine((files) => files.reduce((sum, file) => sum + file.sizeBytes, 0) <= 50 * 1024 * 1024, {
      message: "Total upload size must be 50 MB or less"
    })
});

export const printOptionsSchema = z.object({
  fileId: z.string().uuid(),
  paperSize: z.enum(["A4", "A3"]),
  copies: z.coerce.number().int().min(1).max(1000),
  binding: z.enum(["NONE", "SPIRAL"]),
  lamination: z.coerce.boolean(),
  entireDocumentColor: z.coerce.boolean(),
  colorPageRanges: z.string().trim().max(500).optional().or(z.literal("")),
  totalPages: z.coerce.number().int().min(1).max(20000)
});

export const shopSettingsSchema = z.object({
  name: z.string().trim().min(2).max(120),
  upiId: z.string().trim().min(3).max(120),
  email: z.string().trim().email().optional().or(z.literal("")),
  bwPriceA4: z.coerce.number().min(0),
  bwPriceA3: z.coerce.number().min(0),
  colorPriceA4: z.coerce.number().min(0),
  colorPriceA3: z.coerce.number().min(0),
  spiralBindingPrice: z.coerce.number().min(0),
  laminationPrice: z.coerce.number().min(0)
});
