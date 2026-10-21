import Link from "next/link";
import { NEWS_CATEGORIES, type NewsCategory } from "@/lib/news/constants";

interface NewsCategoryFilterProps {
  selected?: NewsCategory;
}

const BASE_CHIP_CLASSES =
  "shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400";
const ACTIVE_CHIP_CLASSES = "border-brand-700 bg-brand-700 text-white";
const IDLE_CHIP_CLASSES =
  "border-ink-700 bg-ink-900 text-ink-300 hover:border-brand-400 hover:text-white";

// El filtro vive en la URL (/?categoria=Música): se puede compartir, funciona sin JavaScript
// y la lista ya llega filtrada desde el servidor.
export default function NewsCategoryFilter({
  selected,
}: NewsCategoryFilterProps) {
  return (
    <nav aria-label="Filtrar noticias por categoría" className="mb-8">
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        <li>
          <Link
            href="/"
            aria-current={selected ? undefined : "page"}
            className={`${BASE_CHIP_CLASSES} ${selected ? IDLE_CHIP_CLASSES : ACTIVE_CHIP_CLASSES} inline-block`}
          >
            Todas
          </Link>
        </li>
        {NEWS_CATEGORIES.map((category) => (
          <li key={category}>
            <Link
              href={`/?categoria=${encodeURIComponent(category)}`}
              aria-current={selected === category ? "page" : undefined}
              className={`${BASE_CHIP_CLASSES} ${selected === category ? ACTIVE_CHIP_CLASSES : IDLE_CHIP_CLASSES} inline-block`}
            >
              {category}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
