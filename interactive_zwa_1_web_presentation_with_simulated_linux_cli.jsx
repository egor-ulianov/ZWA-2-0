import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getLessonByNumber } from './src/config/lessons.js';
import {
  EditorialChapter,
  EditorialChapterSection,
} from './src/course-ui/content/EditorialChapter.jsx';
import EditorialCode from './src/course-ui/content/EditorialCode.jsx';
import EditorialIllustration from './src/course-ui/content/EditorialIllustration.jsx';
import LessonSummary from './src/course-ui/content/LessonSummary.jsx';
import contentStyles from './src/course-ui/content/content.module.css';
import ExerciseStage from './src/course-ui/exercises/ExerciseStage.jsx';
import PreviousLectureQuiz from './src/course-ui/exercises/PreviousLectureQuiz.jsx';
import StudioEditor from './src/course-ui/exercises/StudioEditor.jsx';
import StudioTabs from './src/course-ui/exercises/StudioTabs.jsx';
import { LearningExperience } from './src/course-ui/learning/LearningExperience.jsx';
import { LearningSection } from './src/course-ui/learning/LearningSection.jsx';
import { useLearningNavigation } from './src/course-ui/learning/useLearningNavigation.js';

// Interactive ZWA-1 presentation with a built-in simulated Linux CLI (no external libs)
// Tailwind is available in canvas preview. All code is self-contained.

// ------------------------------
// Utilities
// ------------------------------
// Simple virtual filesystem
class VFS {
  constructor() {
    this.files = new Map();
  }
  write(path, content) {
    this.files.set(path, content);
  }
  read(path) {
    if (!this.files.has(path)) throw new Error(`cat: ${path}: Soubor neexistuje`);
    return this.files.get(path);
  }
  ls() {
    return [...this.files.keys()].join('\n');
  }
}

// Network simulation data (very simplified & for teaching only)
const NET = {
  interfaces: [
    {
      name: 'eth0',
      ipv4: '192.168.1.57',
      netmask: '255.255.255.0',
      broadcast: '192.168.1.255',
      mac: '02:42:ac:11:00:02',
    },
  ],
  dns: {
    'cvut.cz': {
      A: ['147.32.0.1'],
      NS: ['ns.cvut.cz', 'albert.ics.cvut.cz'],
      TXT: ['v=spf1 include:_spf.cvut.cz ~all'],
      CAA: ['0 issue "letsencrypt.org"'],
    },
    'fel.cvut.cz': {
      A: ['147.32.85.229'],
      NS: ['ns.fel.cvut.cz'],
      TXT: ['v=spf1 include:_spf.fel.cvut.cz ~all'],
    },
    'seznam.cz': {
      A: ['77.75.79.53'],
      NS: ['ns1.seznam.cz', 'ns2.seznam.cz'],
      TXT: ['v=spf1 include:_spf.seznam.cz ~all'],
    },
    '147.32.85.229': { PTR: ['fel.cvut.cz'] },
  },
  traceroutes: {
    'cvut.cz': [
      { hop: 1, host: '192.168.1.1', rtt: 1.1 },
      { hop: 2, host: '10.0.0.1', rtt: 3.4 },
      { hop: 3, host: '147.32.0.1', rtt: 12.7 },
    ],
    'fel.cvut.cz': [
      { hop: 1, host: '192.168.1.1', rtt: 1.0 },
      { hop: 2, host: '10.0.0.1', rtt: 3.2 },
      { hop: 3, host: '147.32.85.229', rtt: 13.0 },
    ],
    'seznam.cz': [
      { hop: 1, host: '192.168.1.1', rtt: 1.2 },
      { hop: 2, host: '10.0.0.1', rtt: 4.8 },
      { hop: 3, host: '77.75.79.53', rtt: 21.2 },
    ],
  },
};

// ------------------------------
// Terminal Emulator (very small)
// ------------------------------
function Terminal({ prompt = 'student@fel:~$', onCommand, height = 340 }) {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  const submit = async () => {
    const cmd = input.trim();
    setInput('');
    const out = await onCommand(cmd);
    setHistory((h) => [...h, { cmd, out }]);
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div
      className="bg-black text-gray-100 rounded-2xl p-3 font-mono text-sm shadow-inner"
      style={{ height }}
    >
      <div className="overflow-auto h-full">
        <div>
          {history.map((h, i) => (
            <div key={i} className="mb-2">
              <div>
                <span className="text-green-400">{prompt}</span> {h.cmd}
              </div>
              {h.out && <pre className="whitespace-pre-wrap text-gray-200 mt-1">{h.out}</pre>}
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="text-green-400">{prompt}</span>
            <label className="sr-only" htmlFor="network-terminal-command">
              Příkaz terminálu
            </label>
            <input
              id="network-terminal-command"
              aria-label="Příkaz terminálu"
              className="bg-transparent flex-1 outline-none caret-white"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="zadejte příkaz a stiskněte Enter (zkuste: help)"
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

  const help = `Dostupné příkazy:
  help                     zobrazí tuto nápovědu
  clear                    vymaže obrazovku
  host <name|ip>           vyhledání DNS
  nslookup [ -type=TYPE ] <name>
  ifconfig                 zobrazí místní rozhraní
  ipconfig                 alias pro ifconfig (název ve Windows)
  ping <host>              simuluje tři ICMP pingy
  traceroute <host>        zobrazí směrovací skoky
  telnet <host> <port>     připojí se a odešle HTTP GET / (ukázka)
  grep <pattern> <file>    jednoduché grep
  cat <file>               vypíše soubor
  ls                       vypíše soubory
  echo "text" > file       přesměruje výstup do souboru

Tipy:
- Zkuste: host cvut.cz | host fel.cvut.cz | host 147.32.85.229
- Zkuste: ifconfig > ifconfigresult.txt a potom: grep 192.168. ifconfigresult.txt`;

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
        ether ${i.mac}  txqueuelen 1000  (Ethernet)`,
      )
      .join('\n');
  }

  function doHost(target) {
    if (!target) return 'použití: host <name|ip>';
    const rec = NET.dns[target];
    if (!rec) return `Hostitel ${target} nebyl nalezen: 3(NXDOMAIN)`;
    const lines = [];
    if (rec.A) rec.A.forEach((a) => lines.push(`${target} má adresu ${a}`));
    if (rec.NS) rec.NS.forEach((ns) => lines.push(`${target} jmenný server ${ns}`));
    if (rec.TXT) rec.TXT.forEach((t) => lines.push(`${target} popisný text \"${t}\"`));
    if (rec.CAA) rec.CAA.forEach((c) => lines.push(`${target} má záznam CAA ${c}`));
    if (rec.PTR) rec.PTR.forEach((p) => lines.push(`${target} ukazatel doménového jména ${p}`));
    return lines.join('\n');
  }

  function doNslookup(args) {
    // nslookup -type=ns cvut.cz
    const tokens = args.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return 'použití: nslookup [-type=TYPE] <name>';
    let type = 'A';
    let name = tokens[tokens.length - 1];
    const typeFlag = tokens.find((t) => t.startsWith('-type='));
    if (typeFlag) type = typeFlag.split('=')[1].toUpperCase();
    const rec = NET.dns[name];
    if (!rec) return `** server nemůže najít ${name}: NXDOMAIN`;
    const values = rec[type];
    if (!values) return `** server nemůže najít ${name} pro typ ${type}`;
    return values.map((v) => `${type}\t${name}\t${v}`).join('\n');
  }

  function doPing(host) {
    if (!host) return 'použití: ping <host>';
    const ip = NET.dns[host]?.A?.[0] || host;
    const rtts = [12.4, 13.1, 12.8].map((n) => n.toFixed(2));
    return rtts
      .map((r, i) => `64 bajtů od ${ip}: icmp_seq=${i + 1} ttl=56 čas=${r} ms`)
      .concat(`--- statistika pingu ${host} ---`, `odeslány 3 pakety, přijaty 3, ztráta 0 %`)
      .join('\n');
  }

  function doTraceroute(host) {
    if (!host) return 'použití: traceroute <host>';
    const hops = NET.traceroutes[host];
    if (!hops) return `traceroute: neznámý hostitel ${host}`;
    return hops.map((h) => `${h.hop}\t${h.host}\t${h.rtt.toFixed(1)} ms`).join('\n');
  }

  function doTelnet(host, port) {
    if (!host || !port) return 'použití: telnet <host> <port>';
    // Demo: we immediately "send" GET / and show a simple HTTP response
    const status = `Připojování k ${NET.dns[host]?.A?.[0] || host}...
Připojeno k ${host}.
Únikový znak je '^]'.
GET / HTTP/1.1
Host: ${host}
User-Agent: terminal-sim\n\n`;
    const body = `HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 32\n\n<html><body>Hello ZWA!</body></html>`;
    return status + body;
  }

  function doGrep(pattern, file) {
    if (!pattern || !file) return 'použití: grep <pattern> <file>';
    try {
      const text = vfs.read(file);
      const lines = text.split(/\r?\n/).filter((l) => l.includes(pattern));
      return lines.join('\n');
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
    if (!raw) return '';

    // handle clear as a special signal (Terminal wipes history)
    if (raw === 'clear') return { __clear: true };

    const { base, toFile } = parse(raw);
    const [cmd, ...args] = base.split(/\s+/);

    let output = '';
    switch (cmd) {
      case 'help':
        output = help;
        break;
      case 'host':
        output = doHost(args[0]);
        break;
      case 'nslookup':
        output = doNslookup(args.join(' '));
        break;
      case 'ifconfig':
      case 'ipconfig':
        output = doIfconfig();
        break;
      case 'ping':
        output = doPing(args[0]);
        break;
      case 'traceroute':
        output = doTraceroute(args[0]);
        break;
      case 'telnet':
        output = doTelnet(args[0], args[1]);
        break;
      case 'grep':
        output = doGrep(args[0], args[1]);
        break;
      case 'cat':
        output = doCat(args[0]);
        break;
      case 'ls':
        output = vfs.ls();
        break;
      case 'echo': {
        const joined = args.join(' ');
        const m = joined.match(/^\"([\s\S]*)\"$/) || joined.match(/^'([\s\S]*)'$/);
        output = m ? m[1] : joined;
        break;
      }
      default:
        output = `${cmd}: příkaz nebyl nalezen`;
    }

    if (toFile) {
      const text = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
      vfs.write(toFile, text);
      return `(výstup přesměrován)\nzapsáno do ${toFile}`;
    }

    return typeof output === 'object' && output?.__clear ? '__CLEAR__' : output;
  }

  return { run };
}

// ------------------------------
// Slides data (from the original PPT) – condensed into sections
// ------------------------------
const NETWORK_TASKS = [
  {
    id: 'network-task-dns',
    title: 'DNS: host / nslookup',
    body: 'Pomocí simulátoru ověřte A, NS nebo TXT záznam domény cvut.cz příkazem host či nslookup.',
    requirement: 'dns',
    examples: ['host cvut.cz', 'nslookup -type=ns cvut.cz', 'host 147.32.85.229'],
    solution:
      '$ host cvut.cz\ncvut.cz má adresu 147.32.0.1\n$ nslookup -type=ns cvut.cz\nNS\tcvut.cz\tns.cvut.cz\nNS\tcvut.cz\talbert.ics.cvut.cz\n$ nslookup -type=txt cvut.cz\nTXT\tcvut.cz\tv=spf1 include:_spf.cvut.cz ~all\n$ host 147.32.85.229\n147.32.85.229 ukazatel doménového jména fel.cvut.cz',
  },
  {
    id: 'network-task-local',
    title: 'Lokální síť a konektivita: ifconfig / ping',
    body: 'Zobrazte lokální rozhraní a ověřte, že rozumíte IP adrese, masce, MAC a latenci.',
    requirement: 'ifconfig',
    examples: [
      'ifconfig',
      'ifconfig > ifconfigresult.txt',
      'grep 192.168. ifconfigresult.txt',
      'ping seznam.cz',
    ],
    solution:
      '$ ifconfig > ifconfigresult.txt\n(výstup přesměrován)\nzapsáno do ifconfigresult.txt\n$ grep 192.168. ifconfigresult.txt\n        inet 192.168.1.57  netmask 255.255.255.0  broadcast 192.168.1.255\n$ ping seznam.cz\n64 bajtů od 77.75.79.53: icmp_seq=1 ttl=56 čas=12.40 ms\n64 bajtů od 77.75.79.53: icmp_seq=2 ttl=56 čas=13.10 ms\n64 bajtů od 77.75.79.53: icmp_seq=3 ttl=56 čas=12.80 ms\n--- statistika pingu seznam.cz ---\nodeslány 3 pakety, přijaty 3, ztráta 0 %',
  },
  {
    id: 'network-task-traceroute',
    title: 'Směrování: traceroute',
    body: 'Vypište jednotlivé směrovače, přes které simulovaný paket putuje k cíli.',
    requirement: 'traceroute',
    examples: ['traceroute fel.cvut.cz', 'traceroute seznam.cz'],
    solution:
      '$ traceroute fel.cvut.cz\n1\t192.168.1.1\t1.0 ms\n2\t10.0.0.1\t3.2 ms\n3\t147.32.85.229\t13.0 ms',
  },
  {
    id: 'network-task-telnet',
    title: 'TCP/HTTP: telnet',
    body: 'Připojte se v simulátoru na port 80 a prohlédněte si ukázku syrové HTTP odpovědi.',
    requirement: 'telnet',
    examples: ['telnet zwa.toad.cz 80'],
    solution:
      '$ telnet zwa.toad.cz 80\nPřipojeno k zwa.toad.cz.\nGET / HTTP/1.1\nHost: zwa.toad.cz\n\nHTTP/1.1 200 OK\nContent-Type: text/html; charset=utf-8',
  },
];

const sections = [
  {
    id: 'title',
    title: 'Základy webových aplikací – 1. cvičení',
    activityType: 'learn',
  },
  {
    id: 'quiz-html',
    title: 'VSTUPNÍ OTÁZKA: ZKUŠENOST',
    activityType: 'quick-check',
    body: 'Jedna nebodovaná otázka o dosavadní zkušenosti s tvorbou webových aplikací.',
  },
  {
    id: 'about-course',
    title: 'O ČEM JE PŘEDMĚT?',
    activityType: 'learn',
  },
  {
    id: 'tips',
    title: 'DOPORUČENÍ PRO SEMESTRÁLKU',
    activityType: 'learn',
  },
  {
    id: 'extras',
    title: 'DODATEČNÉ INFO',
    activityType: 'learn',
  },
  {
    id: 'theory',
    title: 'TEORIE: Síť pro web',
    activityType: 'learn',
    sections: [
      {
        icon: '🌐',
        title: 'DNS – překládání jmen',
        points: [
          'DNS je telefonní seznam internetu: převádí jména (např. fel.cvut.cz) na IP adresy, opačně PTR vrací jméno pro IP.',
          'Záznamy: A/AAAA = adresa serveru, CNAME = alias na jiné jméno, NS = který server je autoritativní, TXT = libovolný text (např. SPF).',
          'Cesta dotazu: váš stroj → rekurzivní resolver (často od ISP) → autoritativní servery (hierarchie: root → TLD → doména).',
          'Výsledky se cachují podle TTL (čas života), existuje i negativní cache pro neexistující jména.',
          'Protokol používá UDP/53 pro většinu dotazů (rychlé, malé), TCP/53 pro větší odpovědi a přenos zón; DNSSEC přidává kryptografické podpisy.',
        ],
      },
      {
        icon: '🔢',
        title: 'IP adresy – jak se zařízení najdou',
        points: [
          'IPv4 má 4 oktety (např. 192.168.1.57). Maska sítě (např. /24) určuje, které adresy jsou „moje síť“ a které jsou mimo.',
          'Privátní rozsahy (10.x, 172.16–31.x, 192.168.x) nejsou přímo routované do internetu; 127.0.0.1 je loopback (sám k sobě).',
          'Default gateway je výchozí router do dalších sítí; broadcast je poslední adresa v síti a slouží k doručení všem v segmentu.',
          'DHCP přiděluje IP, masku, gateway i DNS automaticky. NAT (typicky PAT) překládá více privátních zařízení na jednu veřejnou IP.',
          'K nalezení MAC v lokální síti se používá ARP; mimo lokální síť paket putuje přes směrovače (routers).',
        ],
      },
      {
        icon: '🔗',
        title: 'TCP – spolehlivý přenos',
        points: [
          'Porty identifikují službu na stroji (HTTP 80, HTTPS 443). Jedna IP může mít desítky služeb díky portům.',
          'Připojení se navazuje 3-krokově: SYN → SYN-ACK → ACK. Ukončení spojení probíhá přes FIN/ACK nebo nouzově RST.',
          'Spolehlivost: pořadí a doručení dat hlídají sekvenční čísla a potvrzení (ACK). Při ztrátě paketů probíhají retransmise.',
          'Řízení toku (window, window scaling) brání zahlcení příjemce, řízení zahlcení (např. CUBIC) chrání síť před přetížením.',
          'UDP je alternativa bez záruk a bez navázání spojení (hodí se pro DNS, video/hraní). TLS šifruje nad TCP.',
        ],
      },
      {
        icon: '📄',
        title: 'HTTP – jazyk webu',
        points: [
          'Požadavek obsahuje metodu (GET/POST…), cestu (/api), hlavičky (Headers) a volitelné tělo (Body). Odpověď má status (200/404/500…), hlavičky a tělo.',
          'Idempotentní metody (GET, PUT) lze opakovat bez změny stavu; POST obvykle vytváří/změňuje. HEAD/OPTIONS slouží pro metadata a možnosti.',
          'Cachování: ETag/If-None-Match a Last-Modified/If-Modified-Since, řídí se také Cache-Control a max-age.',
          'Obsah a formát se domlouvá přes Content-Type a Accept (JSON, HTML…). Hostitel je v hlavičce Host (SNI v TLS).',
          'Autentizace: Authorization (např. Bearer token), nebo cookies (Set-Cookie, SameSite, HttpOnly, Secure). Trvalá spojení udržuje keep-alive; HTTP/2 multiplexuje více požadavků.',
        ],
      },
      {
        icon: '🔒',
        title: 'HTTPS – šifrované HTTP',
        points: [
          'TLS poskytuje šifrování, integritu a ověření serveru pomocí certifikátu podepsaného důvěryhodnou CA (řetězec důvěry).',
          'Handshake vyjedná šifry a klíče; moderní TLS (1.2/1.3) používá dopředné utajení (Forward Secrecy). SNI zajistí správný certifikát pro více domén na jedné IP.',
          "Standardní port je 443. HSTS nutí prohlížeč používat jen HTTPS. Let's Encrypt přes ACME automatizuje vydání a obnovu certifikátů.",
        ],
      },
      {
        icon: '🧪',
        title: 'Jak to souvisí s úlohami',
        points: [
          'host / nslookup → zobrazíte A/NS/TXT a pochopíte, odkud se jména berou.',
          'ifconfig / ping → ověříte IP, masku, MAC a základní konektivitu/latenci.',
          'traceroute → uvidíte jednotlivé hopy (směrovače), kde může vznikat zpoždění.',
          'telnet host 80 → pošlete ručně GET / a uvidíte syrovou HTTP/1.1 odpověď; pro HTTPS by byl nutný TLS handshake.',
        ],
      },
    ],
  },
  ...NETWORK_TASKS,
];

function useNetworkNavigation(sectionList, legacyId, firstTaskId) {
  const aliasRequested =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('slide') === legacyId;
  const navigationSections = useMemo(
    () =>
      aliasRequested
        ? sectionList.map((section) =>
            section.id === firstTaskId ? { ...section, id: legacyId } : section,
          )
        : sectionList,
    [aliasRequested, firstTaskId, legacyId, sectionList],
  );
  return { ...useLearningNavigation(navigationSections), sections: navigationSections };
}

function NetworkTheory({ sections }) {
  return (
    <div className={contentStyles.theoryFlow} data-theory-flow="true">
      {sections.map((section, index) => (
        <React.Fragment key={section.title}>
          <section className={contentStyles.theoryTopic} data-theory-topic="true">
            <span className={contentStyles.theoryIndex}>{String(index + 1).padStart(2, '0')}</span>
            <div className={contentStyles.theoryBody}>
              <h3>{section.title}</h3>
              {section.points.map((point) => (
                <p key={point}>{point}</p>
              ))}
            </div>
          </section>
          {index === 1 ? (
            <EditorialIllustration
              alt="Schéma cesty webového požadavku od prohlížeče přes DNS a směrovače k zabezpečenému serveru."
              height={772}
              src="/course-art/editorial/network-request-journey.png"
              width={2038}
            />
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function CoursePurposeChapter() {
  return (
    <EditorialChapter intro="Webová aplikace není jen stránka v prohlížeči. Je to spolupráce uživatelského rozhraní, serverové logiky a komunikační vrstvy, která mezi nimi bezpečně přenáší požadavky a data.">
      <EditorialChapterSection index={1} title="Jedna aplikace, tři odpovědnosti">
        <p>
          Klient, server a komunikace řeší různé problémy, ale výsledný produkt funguje jen tehdy,
          když mají jasně rozdělené role. V průběhu kurzu proto nebudeme sbírat izolované příkazy;
          budeme sledovat, kudy data procházejí a kdo za ně v každém kroku odpovídá.
        </p>
      </EditorialChapterSection>

      <EditorialIllustration
        alt="Klientská aplikace komunikuje přes zabezpečenou síťovou vrstvu se serverem a datovým úložištěm."
        height={771}
        src="/course-art/editorial/course-system-map.png"
        width={2038}
      />

      <EditorialChapterSection index={2} title="Klient: to, co člověk používá">
        <p>
          V prohlížeči skládáme strukturu pomocí HTML, vzhled pomocí CSS a chování pomocí
          JavaScriptu. Dobrý klient není jen hezký: musí být čitelný, přístupný a předvídatelně
          reagovat na vstup uživatele i na stav načítání nebo chybu.
        </p>
      </EditorialChapterSection>

      <EditorialChapterSection index={3} title="Server: pravidla a důvěryhodná data">
        <p>
          Server přijímá požadavky, ověřuje jejich oprávněnost, provádí aplikační logiku a pracuje s
          uloženými daty. Kontroly na klientovi zpříjemňují používání, ale bezpečnostní rozhodnutí a
          validace důležitých dat vždy patří také na server.
        </p>
      </EditorialChapterSection>

      <EditorialChapterSection index={4} title="Komunikace: smlouva mezi oběma stranami">
        <p>
          HTTP určuje podobu požadavku a odpovědi, adresy určují cílový zdroj a stavové kódy
          popisují výsledek. Bezpečné spojení chrání přenos, ale dobře navržené rozhraní navíc jasně
          říká, jaká data očekává a co může klient udělat dál.
        </p>
      </EditorialChapterSection>
    </EditorialChapter>
  );
}

function SemesterProjectChapter() {
  return (
    <EditorialChapter intro="Semestrální práce se daří tehdy, když vzniká jako řada malých ověřených kroků. Cílem není co největší množství funkcí, ale spolehlivá aplikace, jejímž rozhodnutím rozumíte a umíte je obhájit.">
      <EditorialChapterSection index={1} title="Začněte malým, uzavřeným problémem">
        <p>
          Jedna dobře dokončená uživatelská cesta je cennější než široké zadání plné rozpracovaných
          obrazovek. Nejprve si určete, kdo aplikaci používá, jaký úkol v ní dokončí a jak poznáte,
          že řešení funguje.
        </p>
      </EditorialChapterSection>

      <EditorialIllustration
        alt="Semestrální projekt postupuje od jednoduchého nápadu přes kód a verzování k otestované webové aplikaci."
        height={771}
        src="/course-art/editorial/semester-project-route.png"
        width={2038}
      />

      <EditorialChapterSection index={2} title="Stavte po svislých řezech">
        <p>
          Nejprve propojte jednoduché rozhraní s jedním serverovým požadavkem a uložením dat. Až
          tento celek funguje, přidávejte další scénáře. Každý krok tak zůstává spustitelný a chyba
          má omezený prostor, ve kterém ji hledat.
        </p>
      </EditorialChapterSection>

      <EditorialChapterSection index={3} title="Git používejte jako pracovní deník">
        <p>
          Commit zachycuje jednu srozumitelnou změnu a jeho zpráva vysvětluje její účel. Pravidelné
          verzování umožní bezpečně experimentovat, porovnat rozhodnutí a vrátit se k poslednímu
          funkčnímu stavu bez ztráty práce.
        </p>
      </EditorialChapterSection>

      <EditorialChapterSection index={4} title="Ověřujte průběžně, ne až před odevzdáním">
        <p>
          Po každé části projděte hlavní scénář, chybový vstup i prázdný stav. Před odevzdáním pak
          nezachraňujete několik neznámých problémů najednou, ale pouze dokončujete aplikaci, jejíž
          základní cesta už byla mnohokrát ověřena.
        </p>
      </EditorialChapterSection>
    </EditorialChapter>
  );
}

function CourseSupportChapter() {
  return (
    <EditorialChapter intro="Když se zaseknete, napište včas a přiložte dostatek kontextu. Dobře položená otázka umožní ostatním rychle pochopit situaci a často vás při jejím formulování dovede k příčině problému.">
      <EditorialChapterSection index={1} title="Co má obsahovat užitečný dotaz">
        <p>
          Uveďte, čeho jste chtěli dosáhnout, co se stalo místo toho a jaký krok problém spouští.
          Přidejte krátký relevantní úryvek kódu a přesné chybové hlášení; neposílejte hesla, tokeny
          ani celý projekt bez vysvětlení.
        </p>
      </EditorialChapterSection>

      <EditorialIllustration
        alt="Student získává pomoc od skupinové diskuze i strukturovaného výukového kanálu."
        height={771}
        src="/course-art/editorial/course-support-channels.png"
        width={2038}
      />

      <EditorialChapterSection index={2} title="Skupina cvičení pro rychlou koordinaci">
        <p>
          Telegram je vhodný pro krátké organizační otázky, sdílení aktuálních odkazů a rychlé
          ověření, zda podobný problém řeší i někdo další. Technický dotaz formulujte tak, aby byl
          srozumitelný i bez znalosti předchozí konverzace.
        </p>
      </EditorialChapterSection>

      <EditorialChapterSection index={3} title="Discord pro dohledatelnou technickou diskuzi">
        <p>
          Delší otázky, vysvětlení řešení a témata užitečná pro více studentů patří do předmětového
          Discordu. Odpověď nemusí přijít okamžitě, proto na problém upozorněte s předstihem a
          mezitím popište, které varianty jste už vyzkoušeli.
        </p>
        <ul className={contentStyles.editorialChapterLinks}>
          <li>
            <a href="https://t.me/+W4QiRAsv2dxmYzE8" target="_blank" rel="noopener noreferrer">
              <span>Otevřít skupinu cvičení na Telegramu</span>
              <span aria-hidden="true">↗</span>
            </a>
          </li>
          <li>
            <a href="https://discord.gg/YZjJbkvfaS" target="_blank" rel="noopener noreferrer">
              <span>Otevřít Discord předmětu</span>
              <span aria-hidden="true">↗</span>
            </a>
          </li>
        </ul>
      </EditorialChapterSection>
    </EditorialChapter>
  );
}

function LessonSlideContent({ slide, commandLog }) {
  const hasSteps = Array.isArray(slide.steps) && slide.steps.length > 0;
  const hasSections = Array.isArray(slide.sections) && slide.sections.length > 0;
  const [stepIndex, setStepIndex] = useState(0);
  // Each slide owns an independent step sequence.
  /* eslint-disable react-hooks/set-state-in-effect -- reset is the slide transition boundary. */
  useEffect(() => {
    setStepIndex(0);
  }, [slide]);
  /* eslint-enable react-hooks/set-state-in-effect */
  const totalSteps = hasSteps ? slide.steps.length : 0;
  const currentStep = hasSteps ? slide.steps[stepIndex] : null;
  return (
    <>
      {slide.id === 'title' && (
        <LessonSummary
          intro="Rozložíme načtení webu na jednotlivé síťové kroky a každý z nich si ověříme diagnostickým příkazem."
          items={[
            'Zopakujeme, jak DNS převádí jméno na IP adresu.',
            'Projdeme adresaci, směrování a cestu paketů sítí.',
            'Propojíme TCP a TLS s průběhem HTTP požadavku.',
            'Vyzkoušíme nslookup, ipconfig, ping, tracert a telnet v simulovaném terminálu.',
          ]}
        />
      )}
      {slide.body && !hasSections && (
        <div>
          <pre className="whitespace-pre-wrap leading-relaxed">{slide.body}</pre>
        </div>
      )}
      {slide.id === 'theory' && (
        <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 space-y-2">
          <p>
            Tento blok shrnuje síťové základy, na kterých web stojí. Cílem není jen vědět, jaké
            příkazy existují, ale chápat, co se děje „pod kapotou“. Když zadáte adresu do
            prohlížeče, proběhne překlad jména (DNS), naváže se připojení (TCP/TLS) a odešle se HTTP
            požadavek. Každý krok má typické symptomy při potížích a jde zkoumat nástroji níže.
          </p>
          <p>
            V praktických úlohách si vyzkoušíte, jak DNS vrací různé typy záznamů, jak ověřit svoji
            IP konfiguraci a konektivitu, jak se paket dostane přes několik směrovačů až na cílový
            server a jak vypadá syrová HTTP odpověď bez prohlížeče. Tyto dovednosti jsou klíčové k
            diagnostice problémů v praxi.
          </p>
        </div>
      )}
      {hasSections && <NetworkTheory sections={slide.sections} />}
      {slide.bullets && !hasSteps && (
        <ul className="list-disc pl-6 space-y-1 mt-2">
          {slide.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      {slide.id === 'quiz-html' && <ReviewQuiz />}
      {slide.id === 'about-course' && <CoursePurposeChapter />}
      {slide.id === 'tips' && <SemesterProjectChapter />}
      {slide.id === 'extras' && <CourseSupportChapter />}
      {hasSteps && currentStep && (
        <div className="mt-4">
          <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800">
                Krok {stepIndex + 1} / {totalSteps}
              </span>
            </div>
            <div className="font-semibold mb-1">{currentStep.title}</div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2">{currentStep.desc}</p>
            {currentStep.examples && (
              <pre className="text-xs bg-zinc-100/70 dark:bg-zinc-800/70 rounded-lg p-2 whitespace-pre-wrap">
                {currentStep.examples.join('\n')}
              </pre>
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
                  className={`h-2.5 w-2.5 rounded-full border border-zinc-300/60 dark:border-zinc-700 ${
                    i === stepIndex ? 'bg-sky-500' : 'bg-zinc-200 dark:bg-zinc-800'
                  }`}
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
    </>
  );
}

function ReviewQuiz() {
  return <PreviousLectureQuiz lessonNumber={1} />;
}

function TaskChecklist({ commandLog, checked = false, requirementIds }) {
  const reqs = [
    {
      id: 'dns',
      label: 'Požadavek: ověření DNS',
      test: (log) => /^(host|nslookup)\s+.*cvut\.cz/i.test(log),
    },
    {
      id: 'ifconfig',
      label: 'Požadavek: ověření místní konfigurace',
      test: (log) => /^ifconfig/i.test(log) || /^ipconfig/i.test(log),
    },
    {
      id: 'traceroute',
      label: 'Požadavek: ověření směrování',
      test: (log) => /^traceroute\s+.*fel\.cvut\.cz/i.test(log),
    },
    {
      id: 'telnet',
      label: 'Požadavek: ověření TCP/HTTP',
      test: (log) => /^telnet\s+.+\s+80/i.test(log),
    },
  ];
  const selectedRequirements = requirementIds?.length
    ? reqs.filter((requirement) => requirementIds.includes(requirement.id))
    : reqs;
  const checks = selectedRequirements.map((requirement) => ({
    ...requirement,
    ok: commandLog.some((command) => requirement.test(command)),
  }));
  const allSatisfied = checks.every((check) => check.ok);
  return (
    <div aria-live="polite">
      <h4>Kontrolní seznam</h4>
      {checked && (
        <p role="status">
          <strong>{allSatisfied ? '✓ Splněno' : '× Nesplněno'}</strong> —{' '}
          {allSatisfied ? 'kontrola úspěšná' : 'kontrola neúspěšná'}
        </p>
      )}
      <ul>
        {checks.map((check) => {
          return (
            <li key={check.id} data-result-state={check.ok ? 'passed' : 'pending'}>
              <strong>{check.ok ? '✓ Splněno' : '○ Čeká'}</strong> — {check.label}
            </li>
          );
        })}
      </ul>
      <p>Zaznamenané vstupy: {Math.min(commandLog.length, 50)}</p>
    </div>
  );
}

function TerminalPanel({ clearKey, onCommand }) {
  return (
    <div className="lg:sticky lg:top-8">
      <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 shadow">
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200/60 dark:border-zinc-800">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/90" />
            <span className="h-3 w-3 rounded-full bg-amber-400/90" />
            <span className="h-3 w-3 rounded-full bg-green-500/90" />
          </div>
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            IDE — simulovaný Linux terminál
          </span>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <kbd className="px-2 py-1 rounded bg-zinc-200/60 dark:bg-zinc-800">Enter</kbd>
            <span>spustit příkaz</span>
          </div>
        </div>
        <div className="p-3">
          {/* key forces remount to clear history */}
          <Terminal key={clearKey} onCommand={onCommand} />
        </div>
      </div>
      <div className="mt-3 text-xs text-zinc-500">
        <span className="font-semibold">IDE — simulovaný Linux terminál.</span> Tento terminál je
        výuková simulace (bez skutečných síťových volání). Výstupy jsou zjednodušené pro podporu
        úloh.
      </div>
    </div>
  );
}

function NetworkTaskStage({ task, clearKey, commandLog, checked, onCommand, onVerify }) {
  return (
    <ExerciseStage
      brief={
        <>
          <p>{task.body}</p>
          <EditorialCode language="bash" label="Příklady příkazů">
            {task.examples.join('\n')}
          </EditorialCode>
          <p>Spusťte příkazy v terminálu a poté jejich splnění ověřte.</p>
        </>
      }
      onVerify={onVerify}
      preview={
        <div>
          <h4>Průběh simulace</h4>
          <p>Terminál je izolovaná výuková simulace. Neodesílá žádné skutečné síťové požadavky.</p>
          {commandLog.length ? (
            <EditorialCode language="bash" label="Zadané příkazy">
              {commandLog.map((command) => `$ ${command}`).join('\n')}
            </EditorialCode>
          ) : (
            <p>Zatím nebyl spuštěn žádný příkaz.</p>
          )}
        </div>
      }
      privateMarker="network-exercise"
      studio={
        <StudioTabs
          files={[
            {
              id: 'terminal',
              label: 'terminál',
              panel: <TerminalPanel clearKey={clearKey} onCommand={onCommand} />,
            },
          ]}
          solution={{
            label: 'Řešení',
            panel: (
              <StudioEditor
                value={task.solution}
                language="bash"
                label="Referenční přepis příkazů terminálu"
                minHeight="300px"
                readOnly
              />
            ),
          }}
        />
      }
      verification={
        <TaskChecklist
          commandLog={commandLog}
          checked={checked}
          requirementIds={[task.requirement]}
        />
      }
    />
  );
}

export default function App() {
  const { run } = useInterpreter();
  const [clearKeys, setClearKeys] = useState({});
  const [commandLogs, setCommandLogs] = useState({});
  const [checklistChecked, setChecklistChecked] = useState({});

  async function handleCommand(cmd, taskId) {
    const out = await run(cmd);
    if (out === '__CLEAR__') {
      // trigger terminal remount to clear history
      setClearKeys((keys) => ({ ...keys, [taskId]: (keys[taskId] || 0) + 1 }));
      setCommandLogs((logs) => ({ ...logs, [taskId]: [] }));
      setChecklistChecked((checked) => ({ ...checked, [taskId]: false }));
      return '';
    }
    setCommandLogs((logs) => ({
      ...logs,
      [taskId]: [...(logs[taskId] || []), cmd].slice(-50),
    }));
    setChecklistChecked((checked) => ({ ...checked, [taskId]: false }));
    return out;
  }

  const {
    activeSection,
    setActiveSection,
    sections: navigationSections,
  } = useNetworkNavigation(sections, 'tasks-net', NETWORK_TASKS[0].id);
  const current =
    navigationSections.find((section) => section.id === activeSection) || navigationSections[0];
  const activeNetworkTask =
    NETWORK_TASKS.find((task) => task.id === current.id) ||
    (activeSection === 'tasks-net' ? NETWORK_TASKS[0] : null);

  function handleSectionChange(nextSection) {
    const nextTaskId = NETWORK_TASKS.find((task) => task.id === nextSection)?.id || null;
    if (nextTaskId !== activeNetworkTask?.id) {
      setCommandLogs({});
      setChecklistChecked({});
    }
    setActiveSection(nextSection);
  }

  const lesson = getLessonByNumber(1);

  return (
    <LearningExperience
      lesson={lesson}
      sections={navigationSections}
      activeSection={activeSection}
      onChange={handleSectionChange}
      title="ZWA-1: GitLab, síť a HTTP"
      objective="Vysvětlíte cestu požadavku od DNS přes TCP až po HTTP a procvičíte diagnostické příkazy v simulovaném terminálu."
      subtitle="Síťové základy a bezpečný simulovaný Linux terminál"
      footerText="ZWA – Interaktivní výuková ukázka"
    >
      <LearningSection section={current} idPrefix="lesson-network">
        <LessonSlideContent slide={current} commandLog={commandLogs[activeNetworkTask?.id] || []} />
        {activeNetworkTask && (
          <NetworkTaskStage
            key={activeNetworkTask.id}
            task={activeNetworkTask}
            clearKey={`${activeNetworkTask.id}-${clearKeys[activeNetworkTask.id] || 0}`}
            commandLog={commandLogs[activeNetworkTask.id] || []}
            checked={checklistChecked[activeNetworkTask.id] || false}
            onCommand={(command) => handleCommand(command, activeNetworkTask.id)}
            onVerify={() =>
              setChecklistChecked((checked) => ({ ...checked, [activeNetworkTask.id]: true }))
            }
          />
        )}
      </LearningSection>
    </LearningExperience>
  );
}
