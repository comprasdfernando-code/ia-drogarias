// app/dayfestas/_components/Gallery.tsx
import Image from "next/image";

export default function Gallery({ images }: { images: string[] }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((src) => (
        <div
          key={src}
          className="rounded-3xl overflow-hidden bg-white ring-1 ring-black/10 shadow-sm"
        >
          <div className="relative aspect-[4/3]">
            <Image src={src} alt="Trabalho Day Festass" fill className="object-cover" />
          </div>
        </div>
      ))}
    </div>
  );
}
