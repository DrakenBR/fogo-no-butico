/**
 * Seed do Fogo no Butico — cria ~8 perfis fakes, posts e stories.
 *
 * Pré-requisitos:
 *   - As variáveis do .env.local devem estar setadas:
 *       NEXT_PUBLIC_SUPABASE_URL
 *       SUPABASE_SERVICE_ROLE_KEY
 *   - O schema (supabase/schema.sql) já rodou no SQL Editor do Supabase.
 *
 * Rodar:
 *   npm run seed
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("[seed] Falta NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

type LookingFor = "marido" | "amante" | "zoeira";

interface SeedProfile {
  email: string;
  password: string;
  username: string;
  display_name: string;
  city: string;
  age: number;
  looking_for: LookingFor;
  bio: string;
}

const profiles: SeedProfile[] = [
  { email: "re@fogo.test",       password: "fogo1234", username: "re_fagundes",    display_name: "Rê Fagundes",   city: "Asunción",         age: 27, looking_for: "amante", bio: "Sexta-feirinha eu sou outra pessoa 🔥" },
  { email: "bru@fogo.test",      password: "fogo1234", username: "bruninho",       display_name: "Bruninho",      city: "Foz do Iguaçu",    age: 31, looking_for: "marido", bio: "Cervejinha gelada, série e cachorro." },
  { email: "lara@fogo.test",     password: "fogo1234", username: "lara_m",         display_name: "Lara M.",       city: "Ciudad del Este",  age: 24, looking_for: "zoeira", bio: "Sem compromisso, só boa vibe." },
  { email: "teo@fogo.test",      password: "fogo1234", username: "teo",            display_name: "Téo",           city: "São Paulo",        age: 29, looking_for: "marido", bio: "Programador, faço café decente." },
  { email: "manu@fogo.test",     password: "fogo1234", username: "manu",           display_name: "Manu",          city: "Encarnación",      age: 26, looking_for: "amante", bio: "Vinho, livros, viagens curtas." },
  { email: "dao@fogo.test",      password: "fogo1234", username: "dao",            display_name: "Dão",           city: "Curitiba",         age: 33, looking_for: "zoeira", bio: "Churrasco no domingo, sempre." },
  { email: "ju@fogo.test",       password: "fogo1234", username: "ju_santos",      display_name: "Ju Santos",     city: "Asunción",         age: 22, looking_for: "amante", bio: "Faz drinque e dança forró." },
  { email: "rafa@fogo.test",     password: "fogo1234", username: "rafa_dev",       display_name: "Rafa",          city: "Foz do Iguaçu",    age: 28, looking_for: "marido", bio: "Procurando alguém pra dividir o aluguel e a netflix." }
];

const captions = [
  "Sexta chegando e o butico tá pegando fogo 🔥",
  "Procurando alguém pra dividir a conta do delivery e a vida 😅",
  "Sem compromisso, só boa vibe e churrasco no fim de semana",
  "Dia de praia + caipirinha = perfeição",
  "Quem topa um açaí às 23h?",
  "Hoje só vibe boa, ninguém me chateia",
  "Cansei do scroll, vamos pro mundo real?",
  "Brincando com o cachorro num domingo qualquer",
  "Cabelo novo, fase nova 🔥",
  "Tomando vinho sozinho, mas a vibe tá ótima"
];

const storyCaptions = [
  "domingou demaaais",
  "olha que pôr do sol",
  "café e código",
  "ouvindo meu som favorito",
  "praia mode on",
  "",
  "tô passando pra avisar que tô viva"
];

// fotos placeholder de natureza/abstrato (free)
const photoUrls = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&q=70",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&q=70",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=900&q=70",
  "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=900&q=70",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&q=70",
  "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=900&q=70",
  "https://images.unsplash.com/photo-1498550744921-75f79806b8a7?w=900&q=70",
  "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=900&q=70",
  "https://images.unsplash.com/photo-1491466424936-e304919aada7?w=900&q=70",
  "https://images.unsplash.com/photo-1493558103817-58b2924bce98?w=900&q=70"
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

async function ensureUser(p: SeedProfile): Promise<string> {
  // tenta criar; se já existe, busca por e-mail
  const { data: created, error } = await admin.auth.admin.createUser({
    email: p.email,
    password: p.password,
    email_confirm: true
  });
  if (created?.user) return created.user.id;

  if (error && !/already (registered|exists)/i.test(error.message)) {
    throw error;
  }
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = list.users.find((u) => u.email === p.email);
  if (!found) throw new Error(`Não consegui achar/criar usuário ${p.email}`);
  return found.id;
}

async function main() {
  console.log("[seed] criando perfis...");
  const userIds: Record<string, string> = {};

  for (const p of profiles) {
    const uid = await ensureUser(p);
    userIds[p.username] = uid;

    const { error: profErr } = await admin.from("profiles").upsert(
      {
        id: uid,
        username: p.username,
        display_name: p.display_name,
        city: p.city,
        age: p.age,
        looking_for: p.looking_for,
        bio: p.bio
      },
      { onConflict: "id" }
    );
    if (profErr) throw profErr;
    console.log(`  ✓ ${p.display_name} (@${p.username})`);
  }

  console.log("[seed] criando posts...");
  const postIds: string[] = [];
  let pi = 0;
  for (const p of profiles) {
    const n = 1 + (pi % 3); // 1 a 3 posts por perfil
    for (let k = 0; k < n; k++) {
      const { data, error } = await admin
        .from("posts")
        .insert({
          user_id: userIds[p.username],
          media_url: pick(photoUrls, pi + k),
          media_type: "photo" as const,
          caption: pick(captions, pi + k)
        })
        .select("id")
        .single();
      if (error) throw error;
      if (data) postIds.push(data.id);
      pi++;
    }
  }
  console.log(`  ✓ ${postIds.length} posts`);

  console.log("[seed] espalhando 🔥...");
  let fireCount = 0;
  for (let i = 0; i < postIds.length; i++) {
    const post = postIds[i];
    for (let j = 0; j < profiles.length; j++) {
      if ((i + j) % 2 !== 0) continue; // metade reage
      const uid = userIds[profiles[j].username];
      const { error } = await admin
        .from("reactions")
        .insert({ post_id: post, user_id: uid, type: "fire" })
        .select("id")
        .single();
      if (!error) fireCount++;
    }
  }
  console.log(`  ✓ ${fireCount} 🔥`);

  console.log("[seed] criando stories...");
  let storyCount = 0;
  for (let i = 0; i < profiles.length; i++) {
    if (i % 2 === 1) continue; // metade tem story
    const p = profiles[i];
    const { error } = await admin.from("stories").insert({
      user_id: userIds[p.username],
      media_url: pick(photoUrls, i + 3),
      media_type: "photo" as const,
      caption: pick(storyCaptions, i)
    });
    if (!error) storyCount++;
  }
  console.log(`  ✓ ${storyCount} stories`);

  console.log("[seed] criando comentários...");
  let commentCount = 0;
  for (let i = 0; i < postIds.length; i++) {
    const post = postIds[i];
    const author = profiles[(i + 1) % profiles.length];
    const { error } = await admin.from("comments").insert({
      post_id: post,
      user_id: userIds[author.username],
      body: pick(
        ["Que fogo 🔥", "tô on", "manda mensagem", "essa vibe é a melhor", "bota mais fogo!"],
        i
      )
    });
    if (!error) commentCount++;
  }
  console.log(`  ✓ ${commentCount} comentários`);

  console.log("\n[seed] ✅ tudo pronto. Logins de teste (senha = fogo1234):");
  for (const p of profiles) console.log(`   ${p.email}`);
}

main().catch((e) => {
  console.error("[seed] erro:", e);
  process.exit(1);
});
