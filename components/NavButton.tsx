"use client";

import Link from "next/link";

interface NavButtonProps {
  href: string;
  children: React.ReactNode;
}

export default function NavButton({ href, children }: NavButtonProps) {
  return (
    <Link href={href}>
      <button
        className="
          bg-white
          text-red-700
          font-bold
          px-5 py-2
          rounded-lg
          shadow-md
          border border-red-700
          hover:bg-red-700 hover:text-white
          transition-all duration-300
        "
      >
        {children}
      </button>
    </Link>
  );
}