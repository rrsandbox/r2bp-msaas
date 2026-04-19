import { buildAgendaIcsFeed } from "@/modules/agenda/application/agenda-sync";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";

  if (!token) {
    return new Response("Calendario nao encontrado.", { status: 404 });
  }

  const feed = await buildAgendaIcsFeed(token);

  if (!feed) {
    return new Response("Calendario nao encontrado.", { status: 404 });
  }

  return new Response(feed.content, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${feed.fileName}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}