import { getDir } from "@/app/lib/getDir";

export const GET = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const dir = await getDir(Number(id));
  return new Response(JSON.stringify(dir));
};
