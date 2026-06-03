import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/signup", "/auth"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sem envs? Não derruba tudo — só deixa passar (rota pública renderiza, rota privada
  // vai falhar no server component mostrando uma mensagem amigável)
  if (!url || !anon) {
    console.error("[middleware] envs do Supabase ausentes — pulando auth check");
    return response;
  }

  try {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    });

    const { data: { user } } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;
    const isPublic = PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(p + "/"));

    if (!user && !isPublic) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (user && (pathname === "/login" || pathname === "/signup")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  } catch (err) {
    console.error("[middleware] auth check falhou:", err);
    // Falha de rede / config inválida — deixa a request seguir em vez de quebrar tudo
    return response;
  }
}
