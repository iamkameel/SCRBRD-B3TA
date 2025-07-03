import Image from 'next/image';

export function Logo() {
  return (
    <Image
      src="/logo.png"
      alt="SCRBRD Logo"
      width={135}
      height={24}
      priority
    />
  );
}
