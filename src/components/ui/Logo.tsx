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
        src="/logo-saf.png"
        alt="SAF - Service d'Aide aux Formalites"
        width={160}
        height={120}
        className={cn('object-contain', className)}
        priority
      />
    );
    return linked ? <Link href="/">{content}</Link> : content;
  }

  // sm/md = icone + texte "SAF" pour headers
  const iconSize = size === 'sm' ? 28 : 36;
  const textSize = size === 'sm' ? 'text-lg' : 'text-xl';

  const content = (
    <span className={cn('flex items-center gap-2', className)}>
      <Image
        src="/logo-saf.png"
        alt="SAF"
        width={iconSize}
        height={iconSize}
        className="object-contain"
        priority
      />
      <span className={cn('font-bold text-[#1a2e5a]', textSize)}>
        SAF <span className="hidden sm:inline font-normal text-sm text-gray-500">Service d'Aide aux Formalites</span>
      </span>
    </span>
  );

  return linked ? <Link href="/" className="flex items-center">{content}</Link> : content;
}
