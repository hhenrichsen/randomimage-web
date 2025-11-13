export default function App({
  prefix,
  base,
  img,
}: {
  prefix?: string;
  base: string;
  img?: string;
}) {
  const buildUrl = (
    endpoint: string,
    params: Record<string, string | undefined>
  ) => {
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) urlParams.set(key, value);
    });
    const query = urlParams.toString();
    return query ? `${endpoint}?${query}` : endpoint;
  };

  const initialUrl = buildUrl(`${base}/random`, { img, prefix });

  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script
          src="https://unpkg.com/htmx.org@1.9.12"
          integrity="sha384-ujb1lZYygJmzgSwoxRggbCHcjc0rB2XoQrxeTUQyRjrOnlCoYta87iKBWq3EsdM2"
          crossorigin="anonymous"
        ></script>
        <script
          src="https://cdn.jsdelivr.net/npm/@unocss/runtime@0.62.3/uno.global.min.js"
          integrity="sha384-Yj8LgcKAtFfi5aWJk55wgVn9Hg/QgEATY8n1pPy6RkMlvLJrBDhF6fE0s1i3VuuZ"
          crossorigin="anonymous"
        ></script>
        <script
          src="https://cdn.jsdelivr.net/npm/alpinejs@3.15.1/dist/cdn.min.js"
          integrity="sha384-1P3ccpD4L/9t6HWl43VEHcYRLuA3zlADdXoOEnvQOsZHH6caGISdjzrMQOBr4M4T"
          crossorigin="anonymous"
        ></script>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@unocss/reset/normalize.min.css"
        ></link>
      </head>
      <body class="w-full h-full m-0 @dark:bg-slate-900 font-sans text-slate-900 @dark:text-slate-100 flex items-center flex-col">
        <div
          class="flex items-center justify-center flex-1 w-full max-h-full flex-col"
          hx-get={initialUrl}
          hx-trigger="load"
        />
        <button
          hx-get={buildUrl(`${base}/random`, { prefix })}
          hx-trigger="click"
          hx-target="#image"
          class="mt-2"
        >
          Random
        </button>
      </body>
    </html>
  );
}
