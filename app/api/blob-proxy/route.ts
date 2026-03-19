// Proxy for Shelby blob content — serves with correct Content-Type
// so browsers can render images inline instead of downloading
import { NextRequest, NextResponse } from 'next/server';
import { NETWORKS } from '@/app/lib/networks';
import { type NetworkId } from '@/app/types';

const MAX_PREVIEW_BYTES = 5 * 1024 * 1024; // 5 MB limit for preview

const EXT_TO_MIME: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
  bmp: 'image/bmp', ico: 'image/x-icon',
  txt: 'text/plain', json: 'application/json',
  html: 'text/html', css: 'text/css', js: 'text/javascript',
  md: 'text/markdown', csv: 'text/csv', xml: 'text/xml',
  pdf: 'application/pdf',
};

// Detect MIME from magic bytes
function detectMimeFromBytes(buf: Uint8Array): string | null {
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return 'image/webp';
  if (buf[0] === 0x42 && buf[1] === 0x4d) return 'image/bmp';
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return 'application/pdf';
  return null;
}

function getMimeType(blobName: string, bytes: Uint8Array): string {
  // Try magic bytes first (most reliable)
  const fromBytes = detectMimeFromBytes(bytes);
  if (fromBytes) return fromBytes;

  // Try file extension
  const ext = blobName.split('.').pop()?.toLowerCase() ?? '';
  if (EXT_TO_MIME[ext]) return EXT_TO_MIME[ext];

  // Check if content looks like UTF-8 text
  const sample = bytes.slice(0, 512);
  const isText = sample.every(b => b === 0x09 || b === 0x0a || b === 0x0d || (b >= 0x20 && b <= 0x7e));
  if (isText) return 'text/plain';

  return 'application/octet-stream';
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const owner = searchParams.get('owner');
  const name = searchParams.get('name');
  const network = (searchParams.get('network') ?? 'shelbynet') as NetworkId;

  if (!owner || !name) {
    return NextResponse.json({ error: 'Missing owner or name' }, { status: 400 });
  }

  if (!NETWORKS[network]) {
    return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
  }

  const blobUrl = `${NETWORKS[network].shelbyRpc}/v1/blobs/${owner}/${encodeURIComponent(name)}`;

  try {
    const res = await fetch(blobUrl, {
      headers: { Accept: '*/*' },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: res.status });
    }

    const contentLength = Number(res.headers.get('content-length') ?? 0);
    if (contentLength > MAX_PREVIEW_BYTES) {
      return NextResponse.json({ error: 'File too large for preview' }, { status: 413 });
    }

    const arrayBuf = await res.arrayBuffer();
    if (arrayBuf.byteLength > MAX_PREVIEW_BYTES) {
      return NextResponse.json({ error: 'File too large for preview' }, { status: 413 });
    }

    const bytes = new Uint8Array(arrayBuf);
    const mime = getMimeType(name, bytes);

    return new NextResponse(arrayBuf, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Fetch failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
