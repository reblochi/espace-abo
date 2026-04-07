import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  linked?: boolean;
}

export function Logo({ size = 'md', className, linked = true }: LogoProps) {
  // lg = logo vertical complet (pages auth)
  if (size === 'lg') {
    const content = (
      <Image
        src="/logo-franceguichet.png"
        alt="FranceGuichet - Service d'Aide aux Formalites"
        width={160}
        height={120}
        className={cn('object-contain', className)}
        priority
      />
    );
    return linked ? <Link href="/">{content}</Link> : content;
  }

  // sm/md = logo horizontal (le logo contient deja le texte "France Guichet")
  const logoWidth = size === 'sm' ? 160 : 200;
  const logoHeight = size === 'sm' ? 40 : 48;

  const content = (
    <span className={cn('flex items-center', className)}>
      <Image
        src="/logo-franceguichet.png"
        alt="FranceGuichet - Service d'Aide aux Formalites"
        width={logoWidth}
        height={logoHeight}
        className="object-contain"
        priority
      />
    </span>
  );

  return linked ? <Link href="/" className="flex items-center">{content}</Link> : content;
}
