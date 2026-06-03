export type LookingFor = "marido" | "amante" | "zoeira";
export type MediaType = "photo" | "video";
export type ReactionType = "fire";

export type LinkType = "loja" | "youtube" | "instagram" | "tiktok" | "twitch" | "discord";

export interface ProfileLink {
  type: LinkType;
  url: string;
}

export const LINK_TYPES: { id: LinkType; label: string; color: string }[] = [
  { id: "loja",      label: "Loja online", color: "#FF1B6B" },
  { id: "youtube",   label: "YouTube",     color: "#FF0033" },
  { id: "instagram", label: "Instagram",   color: "#E1306C" },
  { id: "tiktok",    label: "TikTok",      color: "#25F4EE" },
  { id: "twitch",    label: "Twitch",      color: "#9146FF" },
  { id: "discord",   label: "Discord",     color: "#5865F2" }
];

export type Theme = "dark" | "light";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  age: number | null;
  city: string | null;
  looking_for: LookingFor;
  avatar_url: string | null;
  verified: boolean;
  is_admin: boolean;
  theme: Theme;
  links: ProfileLink[];
  created_at: string;
}

export interface StoryViewer {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  viewed_at: string;
}

export interface AdminUserRow {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  city: string | null;
  looking_for: LookingFor;
  is_admin: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  posts_count: number;
  fires_count: number;
}

export interface AdminKpis {
  users_total: number;
  users_last_24h: number;
  users_last_7d: number;
  active_users_24h: number;
  admins_total: number;
  posts_total: number;
  posts_last_24h: number;
  fires_total: number;
  fires_last_24h: number;
  comments_total: number;
  comments_last_24h: number;
  stories_active: number;
  stories_total: number;
}

export interface Poll {
  question: string;
  options: string[];
  ends_at?: string | null;
}

export interface Post {
  id: string;
  user_id: string;
  media_url: string;
  media_type: MediaType;
  caption: string | null;
  created_at: string;
  edited_at: string | null;
  scheduled_for: string | null;
  media_urls: string[] | null;
  media_types: MediaType[] | null;
  original_post_id: string | null;
  poll: Poll | null;
  is_anonymous: boolean;
}

export interface PollVote {
  post_id: string;
  user_id: string;
  option_idx: number;
  created_at: string;
}

export interface MessageReaction {
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface CrusherPreview {
  preview_id: string;
  city: string | null;
  blur_avatar: string | null;
  created_at: string;
  initial: string;
  is_match: boolean;
  /** Só vem populado se for match. Null caso contrário. */
  username: string | null;
  display_name: string | null;
}

export interface HighlightCollection {
  user_id: string;
  highlight_collection: string;
  total: number;
  first_at: string;
  last_at: string;
  cover_url: string | null;
}

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  type: ReactionType;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  type: ReactionType;
  created_at: string;
}

export type NotificationKind = "fire_post" | "fire_comment" | "comment" | "mention" | "match";

export interface CrushStatus {
  i_crushed: boolean;
  they_crushed: boolean;
  matched: boolean;
  conversation_id: string | null;
}

export interface MatchSummary {
  conversation_id: string;
  other_id: string;
  other_username: string;
  other_display_name: string;
  other_avatar_url: string | null;
  other_city: string | null;
  matched_at: string;
  last_message_body: string | null;
  last_message_at: string | null;
  last_message_sender: string | null;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface ChatRow {
  kind: "match" | "group";
  chat_id: string;
  title: string;
  avatar_url: string | null;
  subtitle: string;
  last_body: string | null;
  last_at: string;
  last_sender_id: string | null;
  unread_count: number;
  members_count: number;
}

export interface Group {
  id: string;
  name: string;
  avatar_url: string | null;
  created_by: string | null;
  created_at: string;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
  is_admin: boolean;
}

export interface SearchProfileRow {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  city: string | null;
  looking_for: LookingFor;
  distance_km: number | null;
}

export type ReportKind = "post" | "comment" | "user";

export interface AdminReportRow {
  id: string;
  kind: ReportKind;
  target_id: string;
  reason: string | null;
  created_at: string;
  resolved_at: string | null;
  reporter_username: string;
  reporter_display_name: string;
  reporter_avatar_url: string | null;
  snippet: string | null;
  context_username: string | null;
}

export interface NotificationRow {
  id: string;
  kind: NotificationKind;
  post_id: string | null;
  comment_id: string | null;
  read_at: string | null;
  created_at: string;
  actor: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  post: {
    id: string;
    media_url: string;
    caption: string | null;
    owner: {
      username: string;
    } | null;
  } | null;
  comment: {
    id: string;
    body: string;
  } | null;
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: MediaType;
  caption: string | null;
  audio_url: string | null;
  highlight_collection: string | null;
  created_at: string;
  expires_at: string;
}

export interface ActiveStory extends Story {
  username: string;
  display_name: string;
  avatar_url: string | null;
  viewed_by_me: boolean;
}

export interface StoryGroup {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  stories: ActiveStory[];
  hasUnviewed: boolean;
}

export interface WeeklyRankingRow {
  user_id: string;
  username: string;
  display_name: string;
  city: string | null;
  avatar_url: string | null;
  fires: number;
  position: number;
}

export interface FeedPost extends Post {
  author: Pick<Profile, "id" | "username" | "display_name" | "avatar_url" | "city" | "looking_for">;
  fires: number;
  comments_count: number;
  liked_by_me: boolean;
  saved_by_me: boolean;
  /** Quando true, é anônimo e o usuário NÃO matched ainda → renderiza mascarado */
  hidden_anonymous: boolean;
  /** Quando esse post é um repost, info do post original com o autor */
  original?: {
    id: string;
    media_url: string;
    media_type: MediaType;
    caption: string | null;
    media_urls?: string[] | null;
    media_types?: MediaType[] | null;
    author: {
      username: string;
      display_name: string;
      avatar_url: string | null;
    } | null;
  } | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; username: string; display_name: string }; Update: Partial<Profile> };
      posts: { Row: Post; Insert: Omit<Post, "id" | "created_at"> & { id?: string }; Update: Partial<Post> };
      reactions: { Row: Reaction; Insert: Omit<Reaction, "id" | "created_at" | "type"> & { id?: string; type?: ReactionType }; Update: Partial<Reaction> };
      comments: { Row: Comment; Insert: Omit<Comment, "id" | "created_at"> & { id?: string }; Update: Partial<Comment> };
      stories: { Row: Story; Insert: Omit<Story, "id" | "created_at" | "expires_at"> & { id?: string; expires_at?: string }; Update: Partial<Story> };
    };
    Views: {
      weekly_ranking: { Row: WeeklyRankingRow };
      active_stories: { Row: ActiveStory };
      post_stats: { Row: { post_id: string; user_id: string; fires: number; comments: number } };
    };
  };
}
