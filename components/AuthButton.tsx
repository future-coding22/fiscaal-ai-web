'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="text-gray-400">...</div>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/profile" className="text-gray-600 hover:text-gray-900">
          Profiel
        </Link>
        <button
          onClick={() => signOut()}
          className="text-gray-600 hover:text-gray-900"
        >
          Uitloggen
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg"
    >
      Inloggen
    </button>
  );
}
