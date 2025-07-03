import Image from 'next/image';

export function Logo() {
  return (
    <Image
      src="https://placehold.co/135x24.png"
      alt="SCRBRD Logo"
      data-ai-hint="logo"
      width={135}
      height={24}
      priority
    />
  );
}
