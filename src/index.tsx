import { Hono } from "hono";
import * as fs from "node:fs";
import type { ReadStream } from "node:fs";
import { config as dotenv } from "dotenv";
import { getMimeType } from "hono/utils/mime";
import App from "./App";
import { Image } from "./Image";
dotenv();

const app = new Hono();

const root = process.env.ROOT || "/mnt/archive/Images";
const refroot = process.env.REF_ROOT || "/mnt/ref/Images";
const base = process.env.BASE || "";

const createStreamBody = (stream: ReadStream) => {
  const body = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      stream.on("end", () => {
        controller.close();
      });
    },

    cancel() {
      stream.destroy();
    },
  });
  return body;
};

const recurseToImage = (
  path: string,
  root: string = path,
  limit: number = 100
): string | undefined => {
  if (limit <= 0) {
    return undefined;
  }
  if (!fs.existsSync(path)) {
    return undefined;
  }
  const files = fs.readdirSync(path);
  const random = files[Math.floor(Math.random() * files.length)];
  if (random == undefined || random == "__MACOSX") {
    return recurseToImage(root, root, limit - 1);
  }
  if (fs.statSync(`${path}/${random}`).isDirectory()) {
    return recurseToImage(`${path}/${random}`, root, limit - 1);
  }
  const images = files.filter((f) => {
    const lower = f.toLowerCase();
    return (
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".png") ||
      lower.endsWith(".gif")
    );
  });
  if (images.length == 0) {
    return recurseToImage(root, root, limit - 1);
  }
  return path + "/" + images[Math.floor(Math.random() * images.length)];
};

app.use(async (c, next) => {
  console.log(`START\t${c.req.method}\t${c.req.url}`);
  await next();
  console.log(`END\t${c.req.method}\t${c.req.url}\t${c.res.status}`);
});

app.get(base, (c) => {
  return c.html(
    <App prefix={c.req.query("prefix")} img={c.req.query("img")} base={base} />
  );
});

app.get(`${base}/ref`, (c) => {
  return c.html(
    <App
      prefix={c.req.query("prefix")}
      img={c.req.query("img")}
      base={base + "/ref"}
    />
  );
});

app.get(`${base}/img/:path{.*}`, (c) => {
  console.log("HANDLE\t/img");
  const path = c.req.param("path");
  const image = `${root}/${path}`;
  if (!fs.existsSync(image)) {
    c.status(404);
    return c.text("Not Found");
  }
  const mime = getMimeType(image);
  if (mime) {
    c.header("Content-Type", mime);
  }
  const modified = fs.statSync(image).mtime;
  c.header("Last-Modified", modified.toUTCString());
  c.header("Cache-Control", "must-revalidate, max-age=86400");

  return c.body(createStreamBody(fs.createReadStream(image)));
});

app.get(`${base}/ref/img/:path{.*}`, (c) => {
  console.log("HANDLE\t/img");
  const path = c.req.param("path");
  const image = `${refroot}/${path}`;
  if (!fs.existsSync(image)) {
    c.status(404);
    return c.text("Not Found");
  }
  const mime = getMimeType(image);
  if (mime) {
    c.header("Content-Type", mime);
  }
  const modified = fs.statSync(image).mtime;
  c.header("Last-Modified", modified.toUTCString());
  c.header("Cache-Control", "must-revalidate, max-age=86400");

  return c.body(createStreamBody(fs.createReadStream(image)));
});

app.get(`${base}/random`, (c) => {
  console.log("HANDLE\t/random");
  const img = c.req.query("img");
  const prefix = c.req.query("prefix");
  const timer = c.req.query("timer");

  // If specific image requested, show it
  if (img) {
    const imagePath = `${root}/${img}`;
    if (!fs.existsSync(imagePath)) {
      c.status(404);
      return c.text("Not Found");
    }
    const urlParams = new URLSearchParams();
    urlParams.set("img", img);
    if (prefix) urlParams.set("prefix", prefix);
    if (timer) urlParams.set("timer", timer);
    c.header("HX-Push-Url", `${base}?${urlParams.toString()}`);
    return c.html(
      <Image base={base} src={img} prefix={prefix} timer={timer} />
    );
  }

  // Otherwise get random image
  const searchRoot = root + (prefix ? "/" + prefix : "");
  const image = recurseToImage(searchRoot);
  if (!image || !fs.existsSync(image)) {
    c.status(404);
    return c.text("Not Found");
  }
  const stripRoot = image.replace(root + "/", "");
  const urlParams = new URLSearchParams();
  urlParams.set("img", stripRoot);
  if (prefix) urlParams.set("prefix", prefix);
  if (timer) urlParams.set("timer", timer);
  c.header("HX-Push-Url", `${base}?${urlParams.toString()}`);
  return c.html(
    <Image base={base} src={stripRoot} prefix={prefix} timer={timer} />
  );
});

app.get(`${base}/ref/random`, (c) => {
  console.log("HANDLE\t/ref/random");
  const img = c.req.query("img");
  const prefix = c.req.query("prefix");
  const timer = c.req.query("timer");

  // If specific image requested, show it
  if (img) {
    const imagePath = `${refroot}/${img}`;
    if (!fs.existsSync(imagePath)) {
      c.status(404);
      return c.text("Not Found");
    }
    const urlParams = new URLSearchParams();
    urlParams.set("img", img);
    if (prefix) urlParams.set("prefix", prefix);
    if (timer) urlParams.set("timer", timer);
    c.header("HX-Push-Url", `${base}/ref?${urlParams.toString()}`);
    return c.html(
      <Image base={base + "/ref"} src={img} prefix={prefix} timer={timer} />
    );
  }

  // Otherwise get random image
  const searchRoot = refroot + (prefix ? "/" + prefix : "");
  const image = recurseToImage(searchRoot);
  if (!image || !fs.existsSync(image)) {
    c.status(404);
    return c.text("Not Found");
  }
  const stripRoot = image.replace(refroot + "/", "");
  const urlParams = new URLSearchParams();
  urlParams.set("img", stripRoot);
  if (prefix) urlParams.set("prefix", prefix);
  if (timer) urlParams.set("timer", timer);
  c.header("HX-Push-Url", `${base}/ref?${urlParams.toString()}`);
  return c.html(
    <Image base={base + "/ref"} src={stripRoot} prefix={prefix} timer={timer} />
  );
});

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
};
