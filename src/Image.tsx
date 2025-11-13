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
    keydownHandler: null,
    init() {
      // Clear any existing intervals globally (cleanup from previous instances)
      if (window._imageTimerInterval) {
        clearInterval(window._imageTimerInterval);
        window._imageTimerInterval = null;
      }
      
      // Remove old keyboard listener if it exists
      if (window._imageKeydownHandler) {
        window.removeEventListener('keydown', window._imageKeydownHandler);
        window._imageKeydownHandler = null;
      }
      
      // Start timer if we have a duration
      if (this.timerActive && this.timerDuration > 0) {
        this.resumeTimer();
      }
      
      // Keyboard shortcuts
      this.keydownHandler = (e) => {
        // Ignore if user is typing in an input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.key) {
          case ' ':
            e.preventDefault();
            this.triggerRandomNoTimer();
            break;
          case '1':
            e.preventDefault();
            if (this.selectedPrefix) this.startTimer(30, this.selectedPrefix);
            break;
          case '2':
            e.preventDefault();
            if (this.selectedPrefix) this.startTimer(60, this.selectedPrefix);
            break;
          case '3':
            e.preventDefault();
            if (this.selectedPrefix) this.startTimer(300, this.selectedPrefix);
            break;
          case '4':
            e.preventDefault();
            if (this.selectedPrefix) this.startTimer(1800, this.selectedPrefix);
            break;
          case '0':
            e.preventDefault();
            if (this.timerActive) this.stopTimer();
            break;
        }
      };
      
      window.addEventListener('keydown', this.keydownHandler);
      window._imageKeydownHandler = this.keydownHandler;
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
    triggerRandomNoTimer() {
      // Get new random image without timer
      const params = new URLSearchParams();
      if (this.selectedPrefix) {
        params.set('prefix', this.selectedPrefix);
      }
      const url = '${base}/random' + (this.selectedPrefix ? '?' + params.toString() : '');
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
      class="flex flex-1 flex-col items-center w-full"
      id="image"
      x-data={timerScript}
    >
      <div class="flex items-center gap-2 mb-1 w-full">
        <button
          hx-get={`${base}/prev?img=${encodeURIComponent(src)}${
            prefix ? `&prefix=${encodeURIComponent(prefix)}` : ""
          }${timer ? `&timer=${timer}` : ""}`}
          hx-target="#image"
          hx-swap="outerHTML"
          class="px-2 py-1 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 border border-zinc-900 dark:border-zinc-100 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 flex-shrink-0"
          title="Previous image"
        >
          ←
        </button>
        <div class="flex items-center gap-1 text-sm flex-1 min-w-0 overflow-x-auto">
          {folders.map((folder, idx) => {
            const curr = idx + 1;
            const folderPrefix = folders.slice(0, curr).join("/");
            const folderUrl = timer
              ? `${base}/random?prefix=${encodeURIComponent(
                  folderPrefix
                )}&timer=${timer}`
              : `${base}/random?prefix=${encodeURIComponent(folderPrefix)}`;
            return (
              <>
                <span class="text-zinc-600 dark:text-zinc-400">/</span>
                <button
                  hx-get={folderUrl}
                  hx-target="#image"
                  hx-swap="outerHTML"
                  x-on:click={`selectedPrefix = '${folderPrefix.replace(
                    /'/g,
                    "\\'"
                  )}'`}
                  class="text-zinc-950 dark:text-zinc-50 hover:text-green-600 dark:hover:text-green-400 font-medium truncate"
                  title={`Random from ${folderPrefix}`}
                >
                  {folder}
                </button>
              </>
            );
          })}
          <span class="text-zinc-600 dark:text-zinc-400">/</span>
          <span class="text-zinc-600 dark:text-zinc-400 truncate">
            {src.split("/").pop()}
          </span>
        </div>
        <button
          hx-get={`${base}/next?img=${encodeURIComponent(src)}${
            prefix ? `&prefix=${encodeURIComponent(prefix)}` : ""
          }${timer ? `&timer=${timer}` : ""}`}
          hx-target="#image"
          hx-swap="outerHTML"
          class="px-2 py-1 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 border border-zinc-900 dark:border-zinc-100 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 flex-shrink-0"
          title="Next image"
        >
          →
        </button>
      </div>
      <a
        href={`${base}/img/${encodeURIComponent(src)}`}
        class="text-xs decoration-none text-zinc-600 dark:text-zinc-400 text-center hover:text-zinc-950 dark:hover:text-zinc-50 mb-2"
      >
        Direct Link
      </a>
      <div class="flex-1 w-full min-h-0 relative">
        <div
          class="absolute inset-4"
          style={`\
background: url('${base}/img/${encodeURIComponent(src)}'); 
background-position: center;
background-size: contain;
background-repeat: no-repeat;
filter: blur(32px);
opacity: 0.8;`}
        />
        <div
          class="absolute inset-4"
          style={`\
background: url('${base}/img/${encodeURIComponent(src)}'); 
background-position: center;
background-size: contain;
background-repeat: no-repeat;`}
        />
      </div>
      <div class="w-full flex flex-col gap-2 mt-2">
        <div
          class="p-3 bg-white dark:bg-zinc-900 text-xs"
          x-bind:class="selectedPrefix ? 'visible' : 'invisible'"
        >
          <div class="flex flex-col gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <div class="flex gap-2 flex-shrink-0">
                <button
                  x-on:click="startTimer(30, selectedPrefix)"
                  class="px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 border border-zinc-900 dark:border-zinc-100 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  30s
                </button>
                <button
                  x-on:click="startTimer(60, selectedPrefix)"
                  class="px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 border border-zinc-900 dark:border-zinc-100 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  1m
                </button>
                <button
                  x-on:click="startTimer(300, selectedPrefix)"
                  class="px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 border border-zinc-900 dark:border-zinc-100 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  5m
                </button>
                <button
                  x-on:click="startTimer(1800, selectedPrefix)"
                  class="px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 border border-zinc-900 dark:border-zinc-100 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  30m
                </button>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0 ml-auto">
                <span
                  x-show="timerActive"
                  x-text="formatTime(timeRemaining)"
                  class="font-mono text-xs font-semibold"
                ></span>
                <button
                  x-show="timerActive"
                  x-on:click="stopTimer()"
                  class="px-3 py-2 bg-red-600 dark:bg-red-500 text-white border border-zinc-900 dark:border-zinc-100 text-xs font-medium hover:bg-red-700 dark:hover:bg-red-600"
                >
                  Stop
                </button>
              </div>
            </div>
            <span
              class="text-green-600 dark:text-green-400 truncate text-xs font-medium"
              x-text="selectedPrefix"
            ></span>
            <button
              x-on:click="triggerRandomNoTimer()"
              class="px-3 py-3 bg-green-600 dark:bg-green-500 text-white text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 w-full"
            >
              Random
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
