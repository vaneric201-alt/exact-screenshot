/** Image + historical context: the first thing every invention chapter shows. */
export function ContextBlock({
  image,
  alt,
  caption,
  context,
}: {
  image: string;
  alt: string;
  caption: string;
  context: string;
}) {
  return (
    <div className="grid-12 items-center">
      <figure data-reveal className="surface-raised col-span-12 overflow-hidden p-s2 md:col-span-7">
        <img
          src={image}
          alt={alt}
          loading="lazy"
          width={1024}
          height={640}
          className="aspect-[8/5] w-full rounded-md object-cover"
        />
        <figcaption className="px-s2 pb-s1 pt-s2 text-caption text-muted-foreground">
          {caption}
        </figcaption>
      </figure>
      <div data-reveal className="col-span-12 md:col-span-5">
        <p className="kicker text-gold-ink">Bối cảnh</p>
        <p className="mt-s3 border-l-4 border-primary pl-s4 font-display text-h3 font-normal">
          {context}
        </p>
      </div>
    </div>
  );
}
