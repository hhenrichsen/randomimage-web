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
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <style>{`
          * { font-family: 'Inter', sans-serif; }
          @supports (font-variation-settings: normal) {
            * { font-family: 'Inter var', sans-serif; }
          }
        `}</style>
        <script
          src="https://unpkg.com/htmx.org@1.9.12"
          integrity="sha384-ujb1lZYygJmzgSwoxRggbCHcjc0rB2XoQrxeTUQyRjrOnlCoYta87iKBWq3EsdM2"
          crossorigin="anonymous"
        ></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          defer
          src="https://cdn.jsdelivr.net/npm/alpinejs@3.15.1/dist/cdn.min.js"
          integrity="sha384-1P3ccpD4L/9t6HWl43VEHcYRLuA3zlADdXoOEnvQOsZHH6caGISdjzrMQOBr4M4T"
          crossorigin="anonymous"
        ></script>
      </head>
      <body class="w-full h-full m-0 dark:bg-zinc-900 font-sans text-zinc-900 dark:text-zinc-100 flex items-center flex-col p-4">
        <style>{`
          * {
            -webkit-tap-highlight-color: transparent !important;
          }
          button, a {
            outline: none !important; 
            box-shadow: none !important;
            -webkit-box-shadow: none !important;
            --un-ring-width: 0px !important;
            --un-ring-offset-width: 0px !important;
          }
          button:focus, button:focus-visible, button:active,
          a:focus, a:focus-visible, a:active { 
            outline: none !important; 
            box-shadow: none !important;
            -webkit-box-shadow: none !important;
            --un-ring-width: 0px !important;
            --un-ring-offset-width: 0px !important;
          }
        `}</style>
        <div
          id="image"
          class="flex items-center justify-center flex-1 w-full max-h-full flex-col"
          hx-get={initialUrl}
          hx-trigger="load once"
          hx-push-url="false"
          hx-swap="outerHTML"
        />
      </body>
    </html>
  );
}
