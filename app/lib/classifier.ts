// 4-layer blob type classification: extension → magic bytes → size → name pattern
import { type BlobMetadata, type BlobCategory, type BlobClassification, type NetworkId } from '@/app/types';
import { getBlobUrl } from '@/app/lib/utils';

// ── Extension map ─────────────────────────────────────────────────────────────

const EXTENSION_MAP: Record<string, BlobCategory> = {
  // image
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image',
  webp: 'image', svg: 'image', bmp: 'image',
  // video
  mp4: 'video', webm: 'video', avi: 'video', mov: 'video', mkv: 'video',
  // audio
  mp3: 'audio', wav: 'audio', ogg: 'audio', flac: 'audio', aac: 'audio',
  // document
  pdf: 'document', doc: 'document', docx: 'document',
  txt: 'document', md: 'document', html: 'document',
  // data
  json: 'data', csv: 'data', parquet: 'data', xml: 'data', yaml: 'data', yml: 'data',
  // code
  js: 'code', py: 'code', rs: 'code', toml: 'code', env: 'code', wasm: 'code',
  ts: 'code', tsx: 'code', jsx: 'code', go: 'code', cpp: 'code',
  // archive
  zip: 'archive', tar: 'archive', gz: 'archive', '7z': 'archive', rar: 'archive',
  // ai-model
  onnx: 'ai-model', safetensors: 'ai-model', pt: 'ai-model', h5: 'ai-model',
};

// ── Magic byte signatures ─────────────────────────────────────────────────────

const MAGIC_SIGNATURES: Array<{ bytes: number[]; category: BlobCategory }> = [
  { bytes: [0xFF, 0xD8, 0xFF], category: 'image' },          // JPEG
  { bytes: [0x89, 0x50, 0x4E, 0x47], category: 'image' },    // PNG
  { bytes: [0x47, 0x49, 0x46], category: 'image' },          // GIF
  { bytes: [0x52, 0x49, 0x46, 0x46], category: 'video' },    // AVI/WAV RIFF
  { bytes: [0x00, 0x00, 0x00, 0x18], category: 'video' },    // MP4 ftyp
  { bytes: [0x1A, 0x45, 0xDF, 0xA3], category: 'video' },    // MKV/WebM
  { bytes: [0x49, 0x44, 0x33], category: 'audio' },          // MP3 ID3
  { bytes: [0x66, 0x4C, 0x61, 0x43], category: 'audio' },    // FLAC
  { bytes: [0x25, 0x50, 0x44, 0x46], category: 'document' }, // PDF
  { bytes: [0x50, 0x4B, 0x03, 0x04], category: 'archive' },  // ZIP/DOCX
  { bytes: [0x1F, 0x8B], category: 'archive' },              // GZ
  { bytes: [0x37, 0x7A, 0xBC, 0xAF], category: 'archive' },  // 7z
];

// ── Name pattern heuristics ───────────────────────────────────────────────────

const NAME_PATTERNS: Array<{ pattern: RegExp; category: BlobCategory }> = [
  { pattern: /^(IMG_|DSC_|PHOTO_|screenshot)/i, category: 'image' },
  { pattern: /^(VID_|VIDEO_|MOV_)/i, category: 'video' },
  { pattern: /^(AUD_|REC_|recording)/i, category: 'audio' },
  { pattern: /^(backup_|dump_|export_)/i, category: 'archive' },
  { pattern: /\.(model|weights|checkpoint)/i, category: 'ai-model' },
  { pattern: /^(dataset_|data_|corpus_)/i, category: 'data' },
];

// ── Size heuristics ───────────────────────────────────────────────────────────

function guessCategoryFromSize(size: number): BlobCategory {
  if (size < 10_000) return 'data';           // <10 KB — likely text/data
  if (size < 5_000_000) return 'document';    // <5 MB — likely document/image
  if (size < 100_000_000) return 'video';     // <100 MB — could be video
  return 'ai-model';                          // large — likely model/archive
}

// ── Layer 1: Extension ────────────────────────────────────────────────────────

function classifyByExtension(name: string): BlobCategory | null {
  const ext = name.split('.').pop()?.toLowerCase();
  if (!ext) return null;
  return EXTENSION_MAP[ext] ?? null;
}

// ── Layer 2: Magic bytes (async, cached) ──────────────────────────────────────

const MAGIC_CACHE_PREFIX = 'shehuby:classify:';

function getCachedClassification(merkleRoot: string): BlobClassification | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${MAGIC_CACHE_PREFIX}${merkleRoot}`);
    return raw ? (JSON.parse(raw) as BlobClassification) : null;
  } catch {
    return null;
  }
}

function setCachedClassification(merkleRoot: string, result: BlobClassification): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`${MAGIC_CACHE_PREFIX}${merkleRoot}`, JSON.stringify(result));
  } catch {
    // ignore storage quota errors
  }
}

async function classifyByMagicBytes(
  blob: BlobMetadata,
  network: NetworkId
): Promise<BlobCategory | null> {
  try {
    const url = getBlobUrl(blob.owner, blob.name, network);
    const res = await fetch(url, {
      headers: { Range: 'bytes=0-15' },
      cache: 'force-cache',
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const bytes = Array.from(new Uint8Array(buf));
    for (const sig of MAGIC_SIGNATURES) {
      if (sig.bytes.every((b, i) => bytes[i] === b)) return sig.category;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Layer 3: Size heuristic ───────────────────────────────────────────────────

function classifyBySize(size: number): BlobClassification {
  return { category: guessCategoryFromSize(size), confidence: 'low', method: 'size-heuristic' };
}

// ── Layer 4: Name pattern ─────────────────────────────────────────────────────

function classifyByNamePattern(name: string): BlobCategory | null {
  for (const { pattern, category } of NAME_PATTERNS) {
    if (pattern.test(name)) return category;
  }
  return null;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Synchronous classification using L1 (extension), L3 (size), L4 (name pattern).
 * L2 (magic bytes) is async and fires in the background, caching the result.
 */
export function classifyBlob(blob: BlobMetadata, network: NetworkId): BlobClassification {
  // Check cache first
  const cached = getCachedClassification(blob.merkleRoot);
  if (cached) return cached;

  // L1: Extension
  const byExt = classifyByExtension(blob.name);
  if (byExt) {
    const result: BlobClassification = { category: byExt, confidence: 'high', method: 'extension' };
    setCachedClassification(blob.merkleRoot, result);
    return result;
  }

  // L4: Name pattern (before size — more specific)
  const byPattern = classifyByNamePattern(blob.name);
  if (byPattern) {
    const result: BlobClassification = { category: byPattern, confidence: 'low', method: 'name-pattern' };
    // Kick off magic bytes async to upgrade confidence later
    classifyByMagicBytes(blob, network).then((category) => {
      if (category) {
        setCachedClassification(blob.merkleRoot, { category, confidence: 'high', method: 'magic-bytes' });
      }
    }).catch(() => {/* CORS or network failure — ignore, sync classification is sufficient */});
    return result;
  }

  // L2: Trigger magic bytes in background for future calls
  classifyByMagicBytes(blob, network).then((category) => {
    if (category) {
      setCachedClassification(blob.merkleRoot, { category, confidence: 'high', method: 'magic-bytes' });
    }
  });

  // L3: Size fallback
  return classifyBySize(blob.size);
}

/**
 * Async version that awaits magic bytes before returning.
 * Use when you need the highest confidence upfront.
 */
export async function classifyBlobAsync(
  blob: BlobMetadata,
  network: NetworkId
): Promise<BlobClassification> {
  const cached = getCachedClassification(blob.merkleRoot);
  if (cached?.confidence === 'high') return cached;

  const byExt = classifyByExtension(blob.name);
  if (byExt) {
    const result: BlobClassification = { category: byExt, confidence: 'high', method: 'extension' };
    setCachedClassification(blob.merkleRoot, result);
    return result;
  }

  const byMagic = await classifyByMagicBytes(blob, network);
  if (byMagic) {
    const result: BlobClassification = { category: byMagic, confidence: 'high', method: 'magic-bytes' };
    setCachedClassification(blob.merkleRoot, result);
    return result;
  }

  const byPattern = classifyByNamePattern(blob.name);
  if (byPattern) {
    return { category: byPattern, confidence: 'low', method: 'name-pattern' };
  }

  return classifyBySize(blob.size);
}
