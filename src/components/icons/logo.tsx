import Image from 'next/image';

export function Logo() {
  return (
    <Image
      src="https://maverickdesign.co.za/wp-content/uploads/2025/07/SCRBRD-Logo.svg"
      alt="SCRBRD Logo"
      data-ai-hint="logo"
      width={135}
      height={24}
      priority
    />
  );
}
