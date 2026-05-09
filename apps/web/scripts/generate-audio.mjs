#!/usr/bin/env node
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";

const VOICES = {
  female: "RaFzMbMIfqBcIurH6XF9",
  male: "Dslrhjl3ZpzrctukrQSN",
};
const MODEL = "eleven_turbo_v2_5";
const MAX_CHARS_PER_CHUNK = 2400;
const CONTENT_DIR = "content";
const OUTPUT_DIR = path.join("public", "audio");

loadDotenv();
const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("ELEVENLABS_API_KEY not set. Add it to .env or .env.local.");
  process.exit(1);
}

function loadDotenv() {
  const candidates = [
    ".env.local",
    ".env",
    "../.env.local",
    "../.env",
    "../../.env.local",
    "../../.env",
  ];
  for (const file of candidates) {
    try {
      const raw = fsSync.readFileSync(file, "utf-8");
      for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
        if (!m) continue;
        if (process.env[m[1]] !== undefined) continue;
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    } catch {}
  }
}

async function mdToHtml(md) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(md);
  return String(file);
}

function htmlToText(html) {
  let s = html;
  s = s.replace(/<pre[\s\S]*?<\/pre>/gi, " ");
  s = s.replace(/<code[\s\S]*?<\/code>/gi, " ");
  s = s.replace(/<svg[\s\S]*?<\/svg>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<figcaption[\s\S]*?<\/figcaption>/gi, " ");
  s = s.replace(/<button[\s\S]*?<\/button>/gi, " ");
  s = s.replace(
    /<\/(p|h[1-6]|li|blockquote|tr|td|th|div|section|article)>/gi,
    " "
  );
  s = s.replace(/<br\s*\/?>/gi, " ");
  s = s.replace(/<[^>]+>/g, "");
  s = s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"');
  return s.replace(/\s+/g, " ").trim();
}

function chunkBySentence(text, max) {
  const chunks = [];
  let cur = "";
  const sentences = text.split(/(?<=[.!?])\s+/);
  for (const sentence of sentences) {
    let piece = sentence;
    while (piece.length > max) {
      // sentence itself too long; split at comma or word boundary
      const slice = piece.slice(0, max);
      const cut = Math.max(slice.lastIndexOf(", "), slice.lastIndexOf(" "));
      const head = cut > max * 0.5 ? piece.slice(0, cut) : slice;
      if (cur) chunks.push(cur.trim());
      chunks.push(head.trim());
      cur = "";
      piece = piece.slice(head.length).trim();
    }
    if ((cur ? cur.length + 1 : 0) + piece.length > max && cur) {
      chunks.push(cur.trim());
      cur = piece;
    } else {
      cur = cur ? `${cur} ${piece}` : piece;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

async function ttsWithTimestamps(text, voiceId) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0,
        use_speaker_boost: true,
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${body.slice(0, 400)}`);
  }
  return res.json();
}

function alignmentToWords(alignment, timeOffset = 0) {
  const chars = alignment?.characters || [];
  const starts = alignment?.character_start_times_seconds || [];
  const ends = alignment?.character_end_times_seconds || [];
  const words = [];
  let cur = "";
  let curStart = 0;
  let curEnd = 0;
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (/\s/.test(c)) {
      if (cur) {
        words.push({
          text: cur,
          start: +(curStart + timeOffset).toFixed(3),
          end: +(curEnd + timeOffset).toFixed(3),
        });
        cur = "";
      }
    } else {
      if (!cur) curStart = starts[i];
      cur += c;
      curEnd = ends[i];
    }
  }
  if (cur) {
    words.push({
      text: cur,
      start: +(curStart + timeOffset).toFixed(3),
      end: +(curEnd + timeOffset).toFixed(3),
    });
  }
  return { words, lastEnd: ends[ends.length - 1] || 0 };
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function generateForPost(slug, voiceKey) {
  const voiceId = VOICES[voiceKey];
  const mdPath = path.join(CONTENT_DIR, `${slug}.mdx`);
  const md = await fs.readFile(mdPath, "utf-8");
  const { content } = matter(md);
  const html = await mdToHtml(content);
  const text = htmlToText(html);

  if (!text) {
    console.log(`  skip ${slug}.${voiceKey}: empty text`);
    return;
  }

  const hash = crypto
    .createHash("sha1")
    .update(`${voiceKey}:${MODEL}:${text}`)
    .digest("hex");

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const mp3Path = path.join(OUTPUT_DIR, `${slug}.${voiceKey}.mp3`);
  const jsonPath = path.join(OUTPUT_DIR, `${slug}.${voiceKey}.json`);

  if (await fileExists(jsonPath)) {
    try {
      const existing = JSON.parse(await fs.readFile(jsonPath, "utf-8"));
      if (existing.hash === hash && (await fileExists(mp3Path))) {
        console.log(`✓ ${slug}.${voiceKey}: up to date`);
        return;
      }
    } catch {}
  }

  console.log(
    `→ ${slug}.${voiceKey}: generating (${text.length} chars)`
  );
  const chunks = chunkBySentence(text, MAX_CHARS_PER_CHUNK);
  const buffers = [];
  const allWords = [];
  let timeOffset = 0;

  for (let i = 0; i < chunks.length; i++) {
    process.stdout.write(`   chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)... `);
    const result = await ttsWithTimestamps(chunks[i], voiceId);
    const audioBuf = Buffer.from(result.audio_base64, "base64");
    buffers.push(audioBuf);
    const { words, lastEnd } = alignmentToWords(result.alignment, timeOffset);
    allWords.push(...words);
    timeOffset += lastEnd;
    process.stdout.write(`ok (${audioBuf.length} bytes)\n`);
  }

  await fs.writeFile(mp3Path, Buffer.concat(buffers));
  await fs.writeFile(
    jsonPath,
    JSON.stringify(
      {
        slug,
        voice: voiceKey,
        voiceId,
        model: MODEL,
        duration: +timeOffset.toFixed(3),
        words: allWords,
        hash,
      },
      null,
      0
    )
  );

  const totalBytes = buffers.reduce((s, b) => s + b.length, 0);
  console.log(
    `  saved: ${path.basename(mp3Path)} (${(totalBytes / 1024).toFixed(1)} KB), ${allWords.length} words, ${timeOffset.toFixed(1)}s`
  );
}

async function main() {
  const args = process.argv.slice(2);
  const onlySlug = args[0];
  const onlyVoice = args[1];

  let files = (await fs.readdir(CONTENT_DIR)).filter((f) => f.endsWith(".mdx"));
  if (onlySlug) {
    files = files.filter((f) => path.basename(f, ".mdx") === onlySlug);
    if (!files.length) {
      console.error(`No post matching slug "${onlySlug}"`);
      process.exit(1);
    }
  }

  const voices = onlyVoice ? [onlyVoice] : Object.keys(VOICES);
  for (const voice of voices) {
    if (!VOICES[voice]) {
      console.error(`Unknown voice "${voice}". Available: ${Object.keys(VOICES).join(", ")}`);
      process.exit(1);
    }
  }

  console.log(
    `Generating audio for ${files.length} post(s) × ${voices.length} voice(s)`
  );

  for (const file of files) {
    const slug = path.basename(file, ".mdx");
    for (const voice of voices) {
      try {
        await generateForPost(slug, voice);
      } catch (err) {
        console.error(`✗ ${slug}.${voice}: ${err.message}`);
      }
    }
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
