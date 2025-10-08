import React, { useMemo, useRef, useState, useEffect } from "react";
import portraitImg from "./src/interactive-zwa-1/assets/portrait.png";
import discordLogo from "./src/interactive-zwa-1/assets/discord-logo.png";
import telegramQr from "./src/interactive-zwa-1/assets/telegram-qr.png";
import semestralMeme from "./src/interactive-zwa-1/assets/semestral-meme.png";

// Interactive ZWA-1 presentation with a built-in simulated Linux CLI (no external libs)
// Tailwind is available in canvas preview. All code is self-contained.

// ------------------------------
// Utilities
// ------------------------------
function clsx(...xs) {
  return xs.filter(Boolean).join(" ");
}

// Simple virtual filesystem
class VFS {
  constructor() {
    this.files = new Map();
  }
  write(path, content) {
    this.files.set(path, content);
  }
  read(path) {
    if (!this.files.has(path)) throw new Error(`cat: ${path}: No such file`);
    return this.files.get(path);
  }
  ls() {
    return [...this.files.keys()].join("\n");
  }
}

// Network simulation data (very simplified & for teaching only)
const NET = {
  interfaces: [
    {
      name: "eth0",
      ipv4: "192.168.1.57",
      netmask: "255.255.255.0",
      broadcast: "192.168.1.255",
      mac: "02:42:ac:11:00:02",
    },
  ],
  dns: {
    "cvut.cz": {
      A: ["147.32.0.1"],
      NS: ["ns.cvut.cz", "albert.ics.cvut.cz"],
      TXT: ["v=spf1 include:_spf.cvut.cz ~all"],
      CAA: ["0 issue \"letsencrypt.org\""],
    },
    "fel.cvut.cz": {
      A: ["147.32.85.229"],
      NS: ["ns.fel.cvut.cz"],
      TXT: ["v=spf1 include:_spf.fel.cvut.cz ~all"],
    },
    "seznam.cz": {
      A: ["77.75.79.53"],
      NS: ["ns1.seznam.cz", "ns2.seznam.cz"],
      TXT: ["v=spf1 include:_spf.seznam.cz ~all"],
    },
    "147.32.85.229": { PTR: ["fel.cvut.cz"] },
  },
  traceroutes: {
    "cvut.cz": [
      { hop: 1, host: "192.168.1.1", rtt: 1.1 },
      { hop: 2, host: "10.0.0.1", rtt: 3.4 },
      { hop: 3, host: "147.32.0.1", rtt: 12.7 },
    ],
    "fel.cvut.cz": [
      { hop: 1, host: "192.168.1.1", rtt: 1.0 },
      { hop: 2, host: "10.0.0.1", rtt: 3.2 },
      { hop: 3, host: "147.32.85.229", rtt: 13.0 },
    ],
    "seznam.cz": [
      { hop: 1, host: "192.168.1.1", rtt: 1.2 },
      { hop: 2, host: "10.0.0.1", rtt: 4.8 },
      { hop: 3, host: "77.75.79.53", rtt: 21.2 },
    ],
  },
};

// ------------------------------
// Terminal Emulator (very small)
// ------------------------------
function Terminal({ prompt = "student@fel:~$", onCommand, height = 340 }) {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  const submit = async () => {
    const cmd = input.trim();
    setInput("");
    const out = await onCommand(cmd);
    setHistory((h) => [...h, { cmd, out }]);
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="bg-black text-gray-100 rounded-2xl p-3 font-mono text-sm shadow-inner" style={{ height }}>
      <div className="overflow-auto h-full">
        <div>
          {history.map((h, i) => (
            <div key={i} className="mb-2">
              <div><span className="text-green-400">{prompt}</span> {h.cmd}</div>
              {h.out && (
                <pre className="whitespace-pre-wrap text-gray-200 mt-1">{h.out}</pre>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="text-green-400">{prompt}</span>
            <input
              className="bg-transparent flex-1 outline-none caret-white"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="type a command and press Enter (try: help)"
            />
          </div>
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}

// ------------------------------
// Command interpreter
// ------------------------------
function useInterpreter() {
  const vfs = useMemo(() => new VFS(), []);

  const help = `Available commands:
  help                     show this help
  clear                    clear the screen
  host <name|ip>          DNS lookup
  nslookup [ -type=TYPE ] <name>
  ifconfig                 show local interfaces
  ipconfig                 alias for ifconfig (Windows name)
  ping <host>              simulate three ICMP pings
  traceroute <host>        show route hops
  telnet <host> <port>     connect and send HTTP GET / (demo)
  grep <pattern> <file>    simple grep
  cat <file>               print file
  ls                       list files
  echo "text" > file       redirect output to a file

Tips:
- Try: host cvut.cz | host fel.cvut.cz | host 147.32.85.229
- Try: ifconfig > ifconfigresult.txt then: grep 192.168. ifconfigresult.txt`;

  function parse(cmd) {
    // handle redirection: echo "text" > file OR any command ending with > file
    const redirectMatch = cmd.match(/^(.*)\s>\s([^\s]+)$/);
    return { base: redirectMatch ? redirectMatch[1].trim() : cmd, toFile: redirectMatch?.[2] };
  }

  function formatIfconfig() {
    return NET.interfaces
      .map(
        (i) => `\n${i.name}: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet ${i.ipv4}  netmask ${i.netmask}  broadcast ${i.broadcast}
        ether ${i.mac}  txqueuelen 1000  (Ethernet)`
      )
      .join("\n");
  }

  function doHost(target) {
    if (!target) return "usage: host <name|ip>";
    const rec = NET.dns[target];
    if (!rec) return `Host ${target} not found: 3(NXDOMAIN)`;
    const lines = [];
    if (rec.A) rec.A.forEach((a) => lines.push(`${target} has address ${a}`));
    if (rec.NS) rec.NS.forEach((ns) => lines.push(`${target} name server ${ns}`));
    if (rec.TXT) rec.TXT.forEach((t) => lines.push(`${target} descriptive text \"${t}\"`));
    if (rec.CAA) rec.CAA.forEach((c) => lines.push(`${target} has CAA record ${c}`));
    if (rec.PTR) rec.PTR.forEach((p) => lines.push(`${target} domain name pointer ${p}`));
    return lines.join("\n");
  }

  function doNslookup(args) {
    // nslookup -type=ns cvut.cz
    const tokens = args.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return "usage: nslookup [-type=TYPE] <name>";
    let type = "A";
    let name = tokens[tokens.length - 1];
    const typeFlag = tokens.find((t) => t.startsWith("-type="));
    if (typeFlag) type = typeFlag.split("=")[1].toUpperCase();
    const rec = NET.dns[name];
    if (!rec) return `** server can't find ${name}: NXDOMAIN`;
    const values = rec[type];
    if (!values) return `** server can't find ${name} for type ${type}`;
    return values.map((v) => `${type}\t${name}\t${v}`).join("\n");
  }

  function doPing(host) {
    if (!host) return "usage: ping <host>";
    const ip = NET.dns[host]?.A?.[0] || host;
    const rtts = [Math.random() * 10 + 10, Math.random() * 10 + 10, Math.random() * 10 + 10].map((n) => n.toFixed(2));
    return rtts
      .map((r, i) => `64 bytes from ${ip}: icmp_seq=${i + 1} ttl=56 time=${r} ms`)
      .concat(`--- ${host} ping statistics ---`, `3 packets transmitted, 3 received, 0% packet loss`)
      .join("\n");
  }

  function doTraceroute(host) {
    if (!host) return "usage: traceroute <host>";
    const hops = NET.traceroutes[host];
    if (!hops) return `traceroute: unknown host ${host}`;
    return hops.map((h) => `${h.hop}\t${h.host}\t${h.rtt.toFixed(1)} ms`).join("\n");
  }

  function doTelnet(host, port) {
    if (!host || !port) return "usage: telnet <host> <port>";
    // Demo: we immediately "send" GET / and show a simple HTTP response
    const status = `Trying ${NET.dns[host]?.A?.[0] || host}...
Connected to ${host}.
Escape character is '^]'.
GET / HTTP/1.1
Host: ${host}
User-Agent: terminal-sim\n\n`;
    const body = `HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 32\n\n<html><body>Hello ZWA!</body></html>`;
    return status + body;
  }

  function doGrep(pattern, file) {
    if (!pattern || !file) return "usage: grep <pattern> <file>";
    try {
      const text = vfs.read(file);
      const lines = text.split(/\r?\n/).filter((l) => l.includes(pattern));
      return lines.join("\n");
    } catch (e) {
      return String(e.message);
    }
  }

  function doCat(file) {
    try {
      return vfs.read(file);
    } catch (e) {
      return String(e.message);
    }
  }

  function doIfconfig() {
    return formatIfconfig();
  }

  async function run(raw) {
    if (!raw) return "";

    // handle clear as a special signal (Terminal wipes history)
    if (raw === "clear") return { __clear: true };

    const { base, toFile } = parse(raw);
    const [cmd, ...args] = base.split(/\s+/);

    let output = "";
    switch (cmd) {
      case "help":
        output = help;
        break;
      case "host":
        output = doHost(args[0]);
        break;
      case "nslookup":
        output = doNslookup(args.join(" "));
        break;
      case "ifconfig":
      case "ipconfig":
        output = doIfconfig();
        break;
      case "ping":
        output = doPing(args[0]);
        break;
      case "traceroute":
        output = doTraceroute(args[0]);
        break;
      case "telnet":
        output = doTelnet(args[0], args[1]);
        break;
      case "grep":
        output = doGrep(args[0], args[1]);
        break;
      case "cat":
        output = doCat(args[0]);
        break;
      case "ls":
        output = vfs.ls();
        break;
      case "echo": {
        const joined = args.join(" ");
        const m = joined.match(/^\"([\s\S]*)\"$/) || joined.match(/^'([\s\S]*)'$/);
        output = m ? m[1] : joined;
        break;
      }
      default:
        output = `${cmd}: command not found`;
    }

    if (toFile) {
      const text = typeof output === "string" ? output : JSON.stringify(output, null, 2);
      vfs.write(toFile, text);
      return `(output redirected)\nwritten to ${toFile}`;
    }

    return typeof output === "object" && output?.__clear ? "__CLEAR__" : output;
  }

  return { run };
}

// ------------------------------
// Slides data (from the original PPT) – condensed into sections
// ------------------------------
const slides = [
  {
    id: "title",
    title: "Základy webových aplikací – 1. cvičení",
    subtitle: "FEL ČVUT, DCGI – 8. 10. 2025",
    body: `Bc. Egor Ulianov`,
  },
  {
    id: "about-me",
    title: "KDO JSEM JÁ?",
    body: `Jazyky: Čeština, Angličtina, Ruština\nZkušenost: 2019–2025 Misterine (Fullstack), 2025–… DEVEON.ai (Leading SE)\nStudium: OI FEL ČVUT (Bc.), MFF UK (Mgr.)\nCvičící ZWA na FEL ČVUT\nOblasti: Angular, NestJS, NodeJS, .NET, Architektura, Unity, AR, Počítačové vidění`,
  },
  {
    id: "about-course",
    title: "O ČEM JE PŘEDMĚT?",
    bullets: [
      "KLIENT: Design, Logika, Architektura",
      "SERVER: Logika, Bezpečnost, Architektura",
      "KOMUNIKACE: Technologie, Struktura, Bezpečnost",
    ],
  },
  {
    id: "tips",
    title: "DOPORUČENÍ PRO SEMESTRÁLKU",
    bullets: [
      "Pracujte průběžně – vyhnete se stresu",
      "Zvolte jednoduché zadání a udělejte ho kvalitně",
      "Používejte git – zvyk do praxe",
    ],
  },
  {
    id: "extras",
    title: "DODATEČNÉ INFO",
    bullets: [
      "Telegram skupina cvičení (odkazy, Q&A)",
      "FEL ČVUT Discord – odpovědi 1× týdně",
    ],
  },
  {
    id: "tasks-net",
    title: "Úlohy – síť (v terminálu vpravo)",
    body: `Na této stránce si vyzkoušíte základní síťové příkazy. Terminál vpravo je simulovaný – nevytváří skutečná síťová spojení, ale ukazuje typické výstupy, které uvidíte na reálném Linuxu. Využijte ho k pochopení principů DNS, směrování a TCP/HTTP.`,
    steps: [
      {
        title: "DNS: host / nslookup",
        desc: "Překládá doménová jména na IP adresy (A), zobrazuje nameservery (NS), textové záznamy (TXT) a další. Ukazuje, jak DNS vrací různé typy záznamů.",
        examples: ["host cvut.cz", "nslookup -type=ns cvut.cz", "host 147.32.85.229"],
      },
      {
        title: "Lokální síť a konektivita: ifconfig / ping",
        desc: "ifconfig zobrazí IP adresu, masku a MAC vašeho rozhraní. ping měří zpoždění (RTT) k cíli a ztrátu paketů – rychlá kontrola dostupnosti.",
        examples: ["ifconfig", "ifconfig > ifconfigresult.txt", "grep 192.168. ifconfigresult.txt", "ping seznam.cz"],
      },
      {
        title: "Směrování: traceroute",
        desc: "Ukazuje jednotlivé směrovače (hopy), přes které paket prochází k cílovému serveru. Pomáhá najít, kde se zpoždění nebo výpadek děje.",
        examples: ["traceroute fel.cvut.cz", "traceroute seznam.cz"],
      },
      {
        title: "TCP/HTTP: telnet",
        desc: "Naváže TCP spojení na zadaný port a v demu pošle jednoduché HTTP GET /. Výstup simuluje základní HTTP odpověď (status, hlavičky, tělo).",
        examples: ["telnet zwa.toad.cz 80"],
      },
    ],
  },
];

function SlideCard({ slide }) {
  const hasSteps = Array.isArray(slide.steps) && slide.steps.length > 0;
  const [stepIndex, setStepIndex] = useState(0);
  useEffect(() => {
    setStepIndex(0);
  }, [slide]);
  const totalSteps = hasSteps ? slide.steps.length : 0;
  const currentStep = hasSteps ? slide.steps[stepIndex] : null;
  return (
    <div className="p-6 rounded-2xl shadow bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-zinc-200/60 dark:border-zinc-800">
      <h2 className="text-2xl font-bold mb-2">{slide.title}</h2>
      {slide.subtitle && <p className="text-zinc-500 mb-3">{slide.subtitle}</p>}
      {slide.body && (
        <div className={clsx(slide.id === "about-me" ? "grid grid-cols-1 sm:grid-cols-[1fr,180px] gap-4 items-start" : "")}> 
          <pre className="whitespace-pre-wrap leading-relaxed">{slide.body}</pre>
          {slide.id === "about-me" && (
            <div className="justify-self-end">
              <img
                src={portraitImg.src}
                alt="Bc. Egor Ulianov"
                className="h-40 w-40 rounded-2xl object-contain bg-white/80 dark:bg-zinc-900 p-1 ring-2 ring-white/70 dark:ring-zinc-800 shadow"
              />
            </div>
          )}
        </div>
      )}
      {slide.bullets && !hasSteps && (
        <ul className="list-disc pl-6 space-y-1 mt-2">
          {slide.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      {hasSteps && currentStep && (
        <div className="mt-4">
          <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800">Krok {stepIndex + 1} / {totalSteps}</span>
            </div>
            <div className="font-semibold mb-1">{currentStep.title}</div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2">{currentStep.desc}</p>
            {currentStep.examples && (
              <pre className="text-xs bg-zinc-100/70 dark:bg-zinc-800/70 rounded-lg p-2 whitespace-pre-wrap">{currentStep.examples.join("\n")}</pre>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button
              className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 disabled:opacity-50"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={stepIndex === 0}
            >
              Předchozí
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <button
                  key={i}
                  className={clsx(
                    "h-2.5 w-2.5 rounded-full border border-zinc-300/60 dark:border-zinc-700",
                    i === stepIndex ? "bg-sky-500" : "bg-zinc-200 dark:bg-zinc-800"
                  )}
                  onClick={() => setStepIndex(i)}
                  aria-label={`Přejít na krok ${i + 1}`}
                />
              ))}
            </div>
            <button
              className="px-3 py-1.5 text-sm rounded-lg border border-sky-500/30 bg-sky-600 text-white disabled:opacity-50"
              onClick={() => setStepIndex((i) => Math.min(totalSteps - 1, i + 1))}
              disabled={stepIndex === totalSteps - 1}
            >
              Další
            </button>
          </div>
        </div>
      )}
      {slide.id === "tips" && (
        <div className="mt-4 rounded-xl overflow-hidden border border-zinc-200/60 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40">
          <img src={semestralMeme.src} alt="Semestrální meme" className="w-full max-h-80 object-contain bg-white dark:bg-zinc-900 p-2" />
        </div>
      )}
      {slide.id === "extras" && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="https://t.me/+W4QiRAsv2dxmYzE8"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl overflow-hidden border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 hover:shadow transition-shadow"
          >
            <img src={telegramQr.src} alt="Telegram skupina – QR" className="w-full h-48 object-contain bg-white dark:bg-zinc-900 p-2" />
            <div className="px-3 py-2 text-xs text-sky-700 dark:text-sky-400 underline">Otevřít Telegram skupinu</div>
          </a>
          <a
            href="https://discord.gg/YZjJbkvfaS"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl overflow-hidden border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 hover:shadow transition-shadow"
          >
            <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-zinc-900 dark:to-zinc-950">
              <img src={discordLogo.src} alt="FEL Discord" className="h-16 w-16 object-contain" />
            </div>
            <div className="px-3 py-2 text-xs text-indigo-700 dark:text-indigo-400 underline">Připojit se na Discord</div>
          </a>
        </div>
      )}
    </div>
  );
}

function TaskHints() {
  return (
    <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
      <details className="mb-2">
        <summary className="cursor-pointer font-semibold">1) host / nslookup – příklady</summary>
        <pre className="mt-2">{`host cvut.cz
host -t txt cvut.cz  (use nslookup -type=txt cvut.cz)
host fel.cvut.cz
host 147.32.85.229
nslookup -type=ns cvut.cz`}</pre>
      </details>
      <details className="mb-2">
        <summary className="cursor-pointer font-semibold">2) ifconfig / ping – příklady</summary>
        <pre className="mt-2">{`ifconfig > ifconfigresult.txt
cat ifconfigresult.txt
grep 192.168. ifconfigresult.txt
ping seznam.cz`}</pre>
      </details>
      <details className="mb-2">
        <summary className="cursor-pointer font-semibold">3) traceroute – příklady</summary>
        <pre className="mt-2">{`traceroute fel.cvut.cz
traceroute seznam.cz`}</pre>
      </details>
      <details>
        <summary className="cursor-pointer font-semibold">4) telnet – příklady</summary>
        <pre className="mt-2">{`telnet zwa.toad.cz 80`}</pre>
      </details>
    </div>
  );
}

// Media is embedded per-slide instead of a global gallery

export default function App() {
  const { run } = useInterpreter();
  const [clearKey, setClearKey] = useState(0);
  const [active, setActive] = useState(slides[0].id);

  async function handleCommand(cmd) {
    const out = await run(cmd);
    if (out === "__CLEAR__") {
      // trigger terminal remount to clear history
      setClearKey((k) => k + 1);
      return "";
    }
    return out;
  }

  const current = slides.find((s) => s.id === active) || slides[0];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-50 to-sky-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8 relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
          <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-sky-300/40 dark:bg-sky-500/20 blur-3xl" />
          <div className="absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-fuchsia-300/40 dark:bg-fuchsia-500/20 blur-3xl" />
        </div>

        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">ZWA-1: Interactive Web Presentation</h1>
            <p className="text-xs md:text-sm text-zinc-500 mt-1">Simulated Linux CLI on the right →</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <nav className="flex flex-wrap gap-2 mb-3">
              {slides.map((s) => (
                <button
                  key={s.id}
                  className={clsx(
                    "px-3 py-1.5 rounded-full text-sm border",
                    s.id === active
                      ? "bg-sky-600 text-white border-sky-600"
                      : "bg-white/70 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:bg-white"
                  )}
                  onClick={() => setActive(s.id)}
                >
                  {s.title.replace(/ –.*$/, "")}
                </button>
              ))}
            </nav>

            <SlideCard slide={current} />
            {current.id === "tasks-net" && <TaskHints />}
          </div>

          <div>
            <div className="lg:sticky lg:top-8">
              <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 shadow">
                <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200/60 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-500/90" />
                    <span className="h-3 w-3 rounded-full bg-amber-400/90" />
                    <span className="h-3 w-3 rounded-full bg-green-500/90" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <kbd className="px-2 py-1 rounded bg-zinc-200/60 dark:bg-zinc-800">Enter</kbd>
                    <span>run command</span>
                  </div>
                </div>
                <div className="p-3">
                  {/* key forces remount to clear history */}
                  <Terminal key={clearKey} onCommand={handleCommand} />
                </div>
              </div>
              <div className="mt-3 text-xs text-zinc-500">
                Note: This terminal is a classroom simulation (no real network calls). Outputs are simplified to support the exercises.
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-8 text-sm text-zinc-500">
          © 2025 ZWA – Interactive demo for teaching (Egor Ulianov)
        </footer>
      </div>
    </div>
  );
}
