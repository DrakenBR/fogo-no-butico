import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ActiveStory, FeedPost } from "@/types/database";

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
      id, user_id, media_url, media_type, caption, created_at,
      author:profiles!inner(id, username, display_name, avatar_url, city, looking_for),
      reactions(user_id),
      comments(count)
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (userId) query = query.eq("user_id", userId);

  const { data: posts, error } = await query;

  if (error || !posts) return { posts: [], meId };

  const result: FeedPost[] = posts.map((p: any) => {
    const reacts: Array<{ user_id: string }> = p.reactions ?? [];
    const commentsCount: number = p.comments?.[0]?.count ?? 0;
    return {
      id: p.id,
      user_id: p.user_id,
      media_url: p.media_url,
      media_type: p.media_type,
      caption: p.caption,
      created_at: p.created_at,
      author: p.author,
      fires: reacts.length,
      comments_count: commentsCount,
      liked_by_me: meId ? reacts.some((r) => r.user_id === meId) : false
    };
  });

  return { posts: result, meId };
}

export async function getActiveStoryGroups() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("active_stories")
    .select("*")
    .order("created_at", { ascending: true });
  if (error || !data) return [];

  const map = new Map<
    string,
    {
      user_id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      stories: ActiveStory[];
    }
  >();
  for (const s of data as ActiveStory[]) {
    const k = s.user_id;
    if (!map.has(k)) {
      map.set(k, {
        user_id: s.user_id,
        username: s.username,
        display_name: s.display_name,
        avatar_url: s.avatar_url,
        stories: []
      });
    }
    map.get(k)!.stories.push(s);
  }
  return Array.from(map.values());
}
