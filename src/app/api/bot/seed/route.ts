import { NextResponse, type NextRequest } from 'next/server';
import { seedCampusStoriesIfEmpty, seedSingleCampusStory } from '@/actions/seed';
import type { PostSection } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const section = searchParams.get('section') as PostSection | null;

    if (action === 'single') {
      const res = await seedSingleCampusStory(section || undefined);
      return NextResponse.json(res);
    }

    // Default: seed stories if feed is empty
    const res = await seedCampusStoriesIfEmpty();
    return NextResponse.json(res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Bot seeder error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
