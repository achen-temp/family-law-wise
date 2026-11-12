import Link from "next/link";

export function EntryRoleNav({ role }: { role: "attorney" | "client" }) {
  return (
    <nav className="entry-roleNav" aria-label="Sign-in role">
      <Link href="/sign-in" aria-current={role === "attorney" ? "page" : undefined}>Attorney sign-in</Link>
      <Link href="/client/sign-in" aria-current={role === "client" ? "page" : undefined}>Client sign-in</Link>
    </nav>
  );
}
