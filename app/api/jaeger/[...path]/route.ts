import { NextRequest, NextResponse } from 'next/server';

const JAEGER_BASE_URL = process.env.JAEGER_BASE_URL ?? 'http://localhost:16686';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const jaegerPath = path.join('/');
  const search = request.nextUrl.search;
  const url = `${JAEGER_BASE_URL}/api/${jaegerPath}${search}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Jaeger unavailable' }, { status: 502 });
  }
}
