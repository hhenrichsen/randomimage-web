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

const isImageFile = (filename: string): boolean => {
  const lower = filename.toLowerCase();
  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".gif")
  );
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
  const images = files.filter(isImageFile);
  if (images.length == 0) {
    return recurseToImage(root, root, limit - 1);
  }
  return path + "/" + images[Math.floor(Math.random() * images.length)];
};

const getImagesInFolder = (folderPath: string): string[] => {
  if (!fs.existsSync(folderPath)) {
    return [];
  }
  const files = fs.readdirSync(folderPath);
  return files.filter(isImageFile).sort();
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

app.get(`${base}/prev`, (c) => {
  console.log("HANDLE\t/prev");
  const img = c.req.query("img");
  const prefix = c.req.query("prefix");
  const timer = c.req.query("timer");

  if (!img) {
    c.status(400);
    return c.text("Bad Request: img parameter required");
  }

  const imagePath = `${root}/${img}`;
  if (!fs.existsSync(imagePath)) {
    c.status(404);
    return c.text("Not Found");
  }

  // Get the folder containing the current image
  const folder = img.split("/").slice(0, -1).join("/");
  const folderPath = `${root}/${folder}`;
  const images = getImagesInFolder(folderPath);

  if (images.length === 0) {
    c.status(404);
    return c.text("No images in folder");
  }

  const currentFilename = img.split("/").pop();
  const currentIndex = images.indexOf(currentFilename || "");

  if (currentIndex === -1) {
    c.status(404);
    return c.text("Current image not found in folder");
  }

  // Get previous image, wrapping around to the end
  const prevIndex = (currentIndex - 1 + images.length) % images.length;
  const prevImage = folder
    ? `${folder}/${images[prevIndex]}`
    : images[prevIndex];

  const urlParams = new URLSearchParams();
  urlParams.set("img", prevImage);
  if (prefix) urlParams.set("prefix", prefix);
  if (timer) urlParams.set("timer", timer);
  c.header("HX-Push-Url", `${base}?${urlParams.toString()}`);
  return c.html(
    <Image base={base} src={prevImage} prefix={prefix} timer={timer} />
  );
});

app.get(`${base}/next`, (c) => {
  console.log("HANDLE\t/next");
  const img = c.req.query("img");
  const prefix = c.req.query("prefix");
  const timer = c.req.query("timer");

  if (!img) {
    c.status(400);
    return c.text("Bad Request: img parameter required");
  }

  const imagePath = `${root}/${img}`;
  if (!fs.existsSync(imagePath)) {
    c.status(404);
    return c.text("Not Found");
  }

  // Get the folder containing the current image
  const folder = img.split("/").slice(0, -1).join("/");
  const folderPath = `${root}/${folder}`;
  const images = getImagesInFolder(folderPath);

  if (images.length === 0) {
    c.status(404);
    return c.text("No images in folder");
  }

  const currentFilename = img.split("/").pop();
  const currentIndex = images.indexOf(currentFilename || "");

  if (currentIndex === -1) {
    c.status(404);
    return c.text("Current image not found in folder");
  }

  // Get next image, wrapping around to the beginning
  const nextIndex = (currentIndex + 1) % images.length;
  const nextImage = folder
    ? `${folder}/${images[nextIndex]}`
    : images[nextIndex];

  const urlParams = new URLSearchParams();
  urlParams.set("img", nextImage);
  if (prefix) urlParams.set("prefix", prefix);
  if (timer) urlParams.set("timer", timer);
  c.header("HX-Push-Url", `${base}?${urlParams.toString()}`);
  return c.html(
    <Image base={base} src={nextImage} prefix={prefix} timer={timer} />
  );
});

app.get(`${base}/random`, (c) => {
  console.log("HANDLE\t/random");
  const img = c.req.query("img");
  const prefix = c.req.query("prefix");
  const timer = c.req.query("timer");

  // If specific image requested, try to show it
  if (img) {
    try {
      const imagePath = `${root}/${img}`;
      if (fs.existsSync(imagePath) && fs.statSync(imagePath).isFile()) {
        // Don't push to history when showing a specific image that was requested
        // (this happens on initial page load or history navigation)
        return c.html(
          <Image base={base} src={img} prefix={prefix} timer={timer} />
        );
      }
      // Image doesn't exist or is a directory - fall through to get a random one
      console.log("Image not found or is directory, getting random:", img);
    } catch (error) {
      console.error("Error checking image:", error);
      // Fall through to get a random one
    }
  }

  // Get random image
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

app.get(`${base}/ref/prev`, (c) => {
  console.log("HANDLE\t/ref/prev");
  const img = c.req.query("img");
  const prefix = c.req.query("prefix");
  const timer = c.req.query("timer");

  if (!img) {
    c.status(400);
    return c.text("Bad Request: img parameter required");
  }

  const imagePath = `${refroot}/${img}`;
  if (!fs.existsSync(imagePath)) {
    c.status(404);
    return c.text("Not Found");
  }

  // Get the folder containing the current image
  const folder = img.split("/").slice(0, -1).join("/");
  const folderPath = `${refroot}/${folder}`;
  const images = getImagesInFolder(folderPath);

  if (images.length === 0) {
    c.status(404);
    return c.text("No images in folder");
  }

  const currentFilename = img.split("/").pop();
  const currentIndex = images.indexOf(currentFilename || "");

  if (currentIndex === -1) {
    c.status(404);
    return c.text("Current image not found in folder");
  }

  // Get previous image, wrapping around to the end
  const prevIndex = (currentIndex - 1 + images.length) % images.length;
  const prevImage = folder
    ? `${folder}/${images[prevIndex]}`
    : images[prevIndex];

  const urlParams = new URLSearchParams();
  urlParams.set("img", prevImage);
  if (prefix) urlParams.set("prefix", prefix);
  if (timer) urlParams.set("timer", timer);
  c.header("HX-Push-Url", `${base}/ref?${urlParams.toString()}`);
  return c.html(
    <Image base={base + "/ref"} src={prevImage} prefix={prefix} timer={timer} />
  );
});

app.get(`${base}/ref/next`, (c) => {
  console.log("HANDLE\t/ref/next");
  const img = c.req.query("img");
  const prefix = c.req.query("prefix");
  const timer = c.req.query("timer");

  if (!img) {
    c.status(400);
    return c.text("Bad Request: img parameter required");
  }

  const imagePath = `${refroot}/${img}`;
  if (!fs.existsSync(imagePath)) {
    c.status(404);
    return c.text("Not Found");
  }

  // Get the folder containing the current image
  const folder = img.split("/").slice(0, -1).join("/");
  const folderPath = `${refroot}/${folder}`;
  const images = getImagesInFolder(folderPath);

  if (images.length === 0) {
    c.status(404);
    return c.text("No images in folder");
  }

  const currentFilename = img.split("/").pop();
  const currentIndex = images.indexOf(currentFilename || "");

  if (currentIndex === -1) {
    c.status(404);
    return c.text("Current image not found in folder");
  }

  // Get next image, wrapping around to the beginning
  const nextIndex = (currentIndex + 1) % images.length;
  const nextImage = folder
    ? `${folder}/${images[nextIndex]}`
    : images[nextIndex];

  const urlParams = new URLSearchParams();
  urlParams.set("img", nextImage);
  if (prefix) urlParams.set("prefix", prefix);
  if (timer) urlParams.set("timer", timer);
  c.header("HX-Push-Url", `${base}/ref?${urlParams.toString()}`);
  return c.html(
    <Image base={base + "/ref"} src={nextImage} prefix={prefix} timer={timer} />
  );
});

app.get(`${base}/ref/random`, (c) => {
  console.log("HANDLE\t/ref/random");
  const img = c.req.query("img");
  const prefix = c.req.query("prefix");
  const timer = c.req.query("timer");

  // If specific image requested, try to show it
  if (img) {
    try {
      const imagePath = `${refroot}/${img}`;
      if (fs.existsSync(imagePath) && fs.statSync(imagePath).isFile()) {
        // Don't push to history when showing a specific image that was requested
        // (this happens on initial page load or history navigation)
        return c.html(
          <Image base={base + "/ref"} src={img} prefix={prefix} timer={timer} />
        );
      }
      // Image doesn't exist or is a directory - fall through to get a random one
      console.log("Image not found or is directory, getting random:", img);
    } catch (error) {
      console.error("Error checking image:", error);
      // Fall through to get a random one
    }
  }

  // Get random image
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
