import Image from 'next/image';

interface ImageCardProps {
  src: string;
  alt?: string;
  height?: number;
}

export default function ImageCard({ 
  src, 
  alt = 'design',
  height = 170 
}: ImageCardProps) {
  return (
    <div className="w-full sm:w-[280px]">
      <Image
        src={src}
        alt={alt}
        width={280}
        height={height}
        className="w-full rounded-xl object-cover shadow-md hover:shadow-lg transition-shadow duration-300"
        style={{ height: `${height}px` }}
      />
    </div>
  );
}
