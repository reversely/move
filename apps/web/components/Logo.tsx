import Image from "next/image";

type Props = {
  className?: string;
  priority?: boolean;
};

export default function Logo({ className = "h-20 w-auto sm:h-24", priority }: Props) {
  return (
    <Image
      src="/logo.png"
      alt="move"
      width={673}
      height={459}
      priority={priority}
      className={className}
    />
  );
}
