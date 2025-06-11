import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="bg-background text-foreground py-4 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-4">
        <h1 className="text-2xl font-bold">Jino</h1>
        <nav className="space-x-4">
          <Link href="/site" className="hover:text-primary transition">
            Home
          </Link>
          <Link href="/docs" className="hover:text-primary transition">
            Docs
          </Link>
          <Link href="/build" className="hover:text-primary transition">
            Builder
          </Link>
          <a href="https://github.com/your-repo/jino" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
