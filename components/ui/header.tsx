import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header>
          <Image
            className="dark:invert h-5 w-[100px]"
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
          <nav>
            <Link href="/login">Login</Link>
          </nav>
        </header>
  );
}
