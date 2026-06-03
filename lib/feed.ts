import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ActiveStory, FeedPost, StoryGroup } from "@/types/database";

export async function getFeed(
  opts: { limit?: number; userId?: string } = {}
): Promise<{ posts: FeedPost[]; meId: string | null }> {
  const { limit = 20, userId } = opts;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const meId = user?.id ?? null;

  let query = supabase
    .from("posts")
    .select(
      `
      id, user_id, media_url, media_type, caption, created_at, edited_at, scheduled_for,
      media_urls, media_types, original_post_id, poll,
      author:profiles!posts_user_id_fkey(id, username, display_name, avatar_url, city, looking_for),
      reactions(user_id),
      comments(count),
      saved_posts(user_id)
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (userId) query = query.eq("user_id", userId);

  const { data: posts, error } = await query;

  if (error || !posts) return { posts: [], meId };

  // Fetch dos posts originais (pros reposts) em uma query separada — evita o
  // problema de self-reference + nested author que confunde o PostgREST
  const originalIds = posts
    .map((p: any) => p.original_post_id)
    .filter((id: string | null): id is string => !!id);

  let originalsMap: Record<string, any> = {};
  if (originalIds.length > 0) {
    const { data: originals } = await supabase
      .from("posts")
      .select("id, media_url, media_type, caption, media_urls, media_types, author:profiles!posts_user_id_fkey(username, display_name, avatar_url)")
      .in("id", originalIds);
    if (originals) {
      originalsMap = Object.fromEntries(originals.map((o: any) => [o.id, o]));
    }
  }

  const result: FeedPost[] = posts.map((p: any) => {
    const reacts: Array<{ user_id: string }> = p.reactions ?? [];
    const commentsCount: number = p.comments?.[0]?.count ?? 0;
    const saved: Array<{ user_id: string }> = p.saved_posts ?? [];
    return {
      id: p.id,
      user_id: p.user_id,
      media_url: p.media_url,
      media_type: p.media_type,
      caption: p.caption,
      created_at: p.created_at,
      edited_at: p.edited_at ?? null,
      scheduled_for: p.scheduled_for ?? null,
      media_urls: p.media_urls ?? null,
      media_types: p.media_types ?? null,
      original_post_id: p.original_post_id ?? null,
      poll: p.poll ?? null,
      author: p.author,
      original: p.original_post_id ? originalsMap[p.original_post_id] ?? null : null,
      fires: reacts.length,
      comments_count: commentsCount,
      liked_by_me: meId ? reacts.some((r) => r.user_id === meId) : false,
      saved_by_me: meId ? saved.some((r) => r.user_id === meId) : false
    };
  });

  return { posts: result, meId };
}

export async function getActiveStoryGroups(): Promise<StoryGroup[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("active_stories")
    .select("*")
    .order("created_at", { ascending: true });
  if (error || !data) return [];

  const map = new Map<string, StoryGroup>();
  for (const s of data as ActiveStory[]) {
    const k = s.user_id;
    if (!map.has(k)) {
      map.set(k, {
        user_id: s.user_id,
        username: s.username,
        display_name: s.display_name,
        avatar_url: s.avatar_url,
        stories: [],
        hasUnviewed: false
      });
    }
    const g = map.get(k)!;
    g.stories.push(s);
    if (!s.viewed_by_me) g.hasUnviewed = true;
  }

  // Não vistos primeiro, vistos no final
  return Array.from(map.values()).sort((a, b) => {
    if (a.hasUnviewed === b.hasUnviewed) return 0;
    return a.hasUnviewed ? -1 : 1;
  });
}
