import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { join } from 'path';
import { promises as fs } from 'fs';

const DATA_DIR = join(process.cwd(), 'data');
const SETTINGS_FILE = join(DATA_DIR, 'settings.json');

const DEFAULT_SETTINGS = {
  id: 'default',
  presetDuration: 20, // default to 20 minutes
  alarmSound: 'chime',
  volume: 0.5,
};

async function ensureDataDirectory() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Already exists or can't create (handled in read/write)
  }
}

export async function GET() {
  try {
    // 1. Try reading from cookie first (user-specific, serverless compatible)
    const cookieStore = await cookies();
    const settingsCookie = cookieStore.get('powernap_settings');
    if (settingsCookie?.value) {
      try {
        return NextResponse.json(JSON.parse(settingsCookie.value));
      } catch {
        // Fall through on parse error
      }
    }

    // 2. Fall back to local file settings.json (mostly for local development)
    try {
      const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
      const settings = JSON.parse(data);
      return NextResponse.json(settings);
    } catch (readError: unknown) {
      // File probably doesn't exist yet, return defaults
      if (readError && typeof readError === 'object' && 'code' in readError && readError.code === 'ENOENT') {
        return NextResponse.json(DEFAULT_SETTINGS);
      }
      throw readError;
    }
  } catch (error: unknown) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(DEFAULT_SETTINGS); // Fallback to default on error
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate or merge with default settings
    const newSettings = {
      ...DEFAULT_SETTINGS,
      ...body,
      // Ensure specific types
      presetDuration: Number(body.presetDuration) || DEFAULT_SETTINGS.presetDuration,
      alarmSound: String(body.alarmSound) || DEFAULT_SETTINGS.alarmSound,
      volume: typeof body.volume === 'number' ? body.volume : DEFAULT_SETTINGS.volume,
    };
    
    // 1. Set cookie (user-specific, works in read-only serverless like Netlify/Vercel)
    const cookieStore = await cookies();
    cookieStore.set('powernap_settings', JSON.stringify(newSettings), {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    // 2. Try writing to filesystem (will fail silently on Netlify, which is fine since cookie handles it)
    try {
      await ensureDataDirectory();
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(newSettings, null, 2), 'utf-8');
    } catch {
      // Ignore write errors in read-only environments
    }

    return NextResponse.json({ success: true, settings: newSettings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings: ' + message },
      { status: 500 }
    );
  }
}
