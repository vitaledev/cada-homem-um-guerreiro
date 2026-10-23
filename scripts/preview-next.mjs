import { spawn } from "node:child_process";
import {
  openSync,
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runtime = process.execPath;
mkdirSync(resolve(root, "data"), { recursive: true, mode: 0o700 });
function stop(file) {
  if (!existsSync(file)) return;
  try {
    const pid = Number(readFileSync(file, "utf8"));
    if (pid > 1) process.kill(pid, "SIGTERM");
  } catch {}
}
async function wait(url) {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (r.ok) {
        if (url.includes("/api/v1/health")) {
          const data = await r.json();
          if (data.service === "guerreiros-api") return;
        } else return;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("Serviço não respondeu: " + url);
}
function start(name, args, env = {}) {
  const log = openSync(resolve(root, "data/" + name + ".log"), "a", 0o600);
  const child = spawn(runtime, args, {
    cwd: root,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", ...env },
    detached: true,
    stdio: ["ignore", log, log],
  });
  writeFileSync(resolve(root, "data/" + name + ".pid"), String(child.pid), {
    mode: 0o600,
  });
  child.unref();
}
stop(resolve(root, "data/api.pid"));
await new Promise((r) => setTimeout(r, 300));
start("api", ["apps/api/dist/main.js"], { PORT: "4187", HOST: "127.0.0.1" });
await wait("http://127.0.0.1:4187/api/v1/health");
// A aplicação anterior só sai da porta quando a API nova já estiver disponível.
stop(resolve(root, ".preview.pid"));
stop(resolve(root, "data/web.pid"));
await new Promise((r) => setTimeout(r, 500));
start("web", ["apps/web/.next/standalone/apps/web/server.js"], {
  NODE_ENV: "production",
  HOSTNAME: "127.0.0.1",
  PORT: "8000",
  API_INTERNAL_URL: "http://127.0.0.1:4187",
});
await wait("http://127.0.0.1:8000/");
console.log(
  "Next.js + NestJS disponíveis: http://127.0.0.1:8000/ | Admin: /admin/",
);
