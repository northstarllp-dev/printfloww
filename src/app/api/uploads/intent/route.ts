import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { uploadIntentSchema } from "@/lib/validation";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

function extensionFor(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  return ext ? `.${ext}` : "";
}

export async function POST(request: Request) {
  const parsed = uploadIntentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "printfloww-private";
  const uploadGroup = randomUUID();

  const signedUploads = await Promise.all(
    parsed.data.files.map(async (file) => {
      const id = randomUUID();
      const path = `incoming/${uploadGroup}/${id}${extensionFor(file.name)}`;
      const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);

      if (error || !data) throw new Error(error?.message ?? "Could not create signed upload URL");

      return {
        id,
        originalName: file.name,
        storagePath: path,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        signedUrl: data.signedUrl,
        token: data.token
      };
    })
  );

  return NextResponse.json({ bucket, uploads: signedUploads });
}
