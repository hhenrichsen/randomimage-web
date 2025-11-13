export function Image({
  src,
  prefix,
  randomPrefix,
  base,
}: {
  src: string;
  prefix?: string;
  randomPrefix?: string;
  base: string;
}) {
  return (
    <div class="max-w-full w-full flex flex-1 flex-col items-center" id="image">
      <h2 class="font-sans text-slate-900 @dark:text-slate-100">{src}</h2>
      <div
        class="flex-1 w-full"
        style={`\
background: url('${base}/img/${encodeURIComponent(src)}'); 
background-position: center;
background-size: contain;
background-repeat: no-repeat;`}
      />
      <a
        href={`${base}/img/${encodeURIComponent(src)}`}
        class="text-sm decoration-none text-slate-400 @dark:text-slate-600"
      >
        Direct Link
      </a>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 w-full">
        {src
          .split("/")
          .slice(0, -1)
          .map((it, idx, l) => {
            const curr = idx + 1;
            return (
              <button
                hx-get={`${base}/random?prefix=${src
                  .split("/")
                  .slice(0, curr)
                  .join("/")}`}
                hx-trigger="click"
                hx-target="#image"
                hx-swap="outerHTML"
                class="truncate px-3 py-2 min-w-0"
                title={`Random From ${it}`}
              >
                Random From {it}
              </button>
            );
          })}
      </div>
    </div>
  );
}
