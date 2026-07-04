import Navbar from '@/components/ui/Navbar';
import Hero from '@/components/ui/Hero';


export const metadata = {
  title: 'Fluid — Send Crypto to Anyone. Any Chain. Any Asset.',
  description: 'One wallet. One balance. No bridges. No network switching. Powered by Particle Network Universal Accounts.',
};

export default function Home() {
  return (
    <main style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Navbar />
      <Hero />
    </main>
  );
}
