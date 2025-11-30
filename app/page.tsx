import { Hero } from '@/components/Hero';
import { Chat } from '@/components/Chat';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen px-4">
      <Hero />
      <Chat />
      <Footer />
    </main>
  );
}
