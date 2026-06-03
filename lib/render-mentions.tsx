import Link from "next/link";

/**
 * Quebra o texto em palavras e transforma @username em link pro perfil.
 * Mantém o resto do texto como está.
 */
export function renderMentions(body: string): React.ReactNode {
  const parts = body.split(/(@[a-z0-9_]{1,24})/gi);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      const username = part.slice(1).toLowerCase();
      return (
        <Link
          key={i}
          href={`/perfil/${username}`}
          style={{ color: "#FF1B6B", fontWeight: 600, textDecoration: "none" }}
        >
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
