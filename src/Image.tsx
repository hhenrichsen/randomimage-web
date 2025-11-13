export function Image({
  src,
  prefix,
  randomPrefix,
  base,
  timer,
}: {
  src: string;
  prefix?: string;
  randomPrefix?: string;
  base: string;
  timer?: string;
}) {
  const folders = src.split("/").slice(0, -1);
  const timerSeconds = timer ? parseInt(timer, 10) : 0;

  const timerScript = `{
    timerActive: ${timerSeconds > 0 ? "true" : "false"},
    timerDuration: ${timerSeconds},
    timeRemaining: ${timerSeconds},
    selectedPrefix: '${prefix || ""}',
    currentImage: '${src.replace(/'/g, "\\'")}',
    interval: null,
    init() {
      // Clear any existing intervals globally (cleanup from previous instances)
      if (window._imageTimerInterval) {
        clearInterval(window._imageTimerInterval);
        window._imageTimerInterval = null;
      }
      
      // Start timer if we have a duration
      if (this.timerActive && this.timerDuration > 0) {
        this.resumeTimer();
      }
    },
    resumeTimer() {
      // Clear any existing timer first
      if (this.interval) {
        clearInterval(this.interval);
      }
      if (window._imageTimerInterval) {
        clearInterval(window._imageTimerInterval);
      }
      
      this.interval = setInterval(() => {
        this.timeRemaining--;
        if (this.timeRemaining <= 0) {
          this.triggerRandom();
        }
      }, 1000);
      
      // Store globally to ensure cleanup
      window._imageTimerInterval = this.interval;
    },
    startTimer(duration, prefix) {
      // Keep current image but add timer
      const params = new URLSearchParams();
      params.set('img', this.currentImage);
      params.set('prefix', prefix);
      params.set('timer', duration.toString());
      const url = '${base}/random?' + params.toString();
      htmx.ajax('GET', url, {target: '#image', swap: 'outerHTML'});
    },
    stopTimer() {
      // Keep current image but remove timer
      const params = new URLSearchParams();
      params.set('img', this.currentImage);
      if (this.selectedPrefix) {
        params.set('prefix', this.selectedPrefix);
      }
      const url = '${base}/random?' + params.toString();
      htmx.ajax('GET', url, {target: '#image', swap: 'outerHTML'});
    },
    triggerRandom() {
      // Get new random image with same timer
      const params = new URLSearchParams();
      params.set('prefix', this.selectedPrefix);
      params.set('timer', this.timerDuration.toString());
      const url = '${base}/random?' + params.toString();
      htmx.ajax('GET', url, {target: '#image', swap: 'outerHTML'});
    },
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return mins > 0 ? mins + 'm ' + secs + 's' : secs + 's';
    }
  }`;

  return (
    <div
      class="flex flex-1 flex-col items-center max-w-full"
      id="image"
      x-data={timerScript}
    >
      <h2 class="font-sans text-slate-900 @dark:text-slate-100 text-sm mb-1 max-w-full truncate">
        {src}
      </h2>
      <div
        class="flex-1 w-full min-h-0"
        style={`\
background: url('${base}/img/${encodeURIComponent(src)}'); 
background-position: center;
background-size: contain;
background-repeat: no-repeat;`}
      />
      <div class="max-w-full flex flex-col gap-1 mt-1 self-stretch">
        <a
          href={`${base}/img/${encodeURIComponent(src)}`}
          class="text-xs decoration-none text-slate-400 @dark:text-slate-600 text-center"
        >
          Direct Link
        </a>

        <div
          class="p-1.5 bg-slate-100 @dark:bg-slate-800 rounded text-xs"
          x-show="selectedPrefix"
        >
          <div class="flex items-center justify-between gap-1.5 mb-1">
            <span
              class="text-blue-600 @dark:text-blue-400 truncate flex-1 text-xs"
              x-text="selectedPrefix"
            ></span>
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <span
                x-show="timerActive"
                x-text="formatTime(timeRemaining)"
                class="font-mono text-xs"
              ></span>
              <button
                x-show="timerActive"
                x-on:click="stopTimer()"
                class="px-1.5 py-0.5 bg-red-500 text-white rounded text-xs"
              >
                Stop
              </button>
            </div>
          </div>
          <div class="flex gap-1">
            <button
              x-on:click="startTimer(30, selectedPrefix)"
              class="px-1.5 py-0.5 bg-blue-500 text-white rounded flex-1 text-xs"
            >
              30s
            </button>
            <button
              x-on:click="startTimer(60, selectedPrefix)"
              class="px-1.5 py-0.5 bg-blue-500 text-white rounded flex-1 text-xs"
            >
              1m
            </button>
            <button
              x-on:click="startTimer(300, selectedPrefix)"
              class="px-1.5 py-0.5 bg-blue-500 text-white rounded flex-1 text-xs"
            >
              5m
            </button>
            <button
              x-on:click="startTimer(1800, selectedPrefix)"
              class="px-1.5 py-0.5 bg-blue-500 text-white rounded flex-1 text-xs"
            >
              30m
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
          {folders.map((it, idx) => {
            const curr = idx + 1;
            const folderPrefix = folders.slice(0, curr).join("/");
            const folderUrl = timer
              ? `${base}/random?prefix=${encodeURIComponent(
                  folderPrefix
                )}&timer=${timer}`
              : `${base}/random?prefix=${encodeURIComponent(folderPrefix)}`;
            return (
              <button
                hx-get={folderUrl}
                hx-target="#image"
                hx-swap="outerHTML"
                x-on:click={`selectedPrefix = '${folderPrefix.replace(
                  /'/g,
                  "\\'"
                )}'`}
                class="truncate px-2 py-1 min-w-0 text-xs bg-slate-200 @dark:bg-slate-700 hover:bg-slate-300 @dark:hover:bg-slate-600 rounded"
                title={`Random From ${it}`}
              >
                Random From {it}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
