import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { clampChroma, formatHex } from 'culori'
import { ImageResponse } from 'next/og'

import type { Project } from './project-schema'

export const ogSize = { width: 1200, height: 630 }

const INK = '#101419'
const PAPER = '#eceff1'

// Satori cannot read oklch(), so the light-theme fill is converted here with
// the same lightness and chroma the site uses.
export const fillHex = (hue: number) =>
  formatHex(clampChroma({ mode: 'oklch', l: 0.78, c: 0.12, h: hue }, 'oklch'))

const font = (file: string) =>
  readFile(join(process.cwd(), 'assets/fonts', file))

// Sofia Sans draws Bulgarian Cyrillic by default, which matters here because
// Satori ignores `lang` and OpenType locl.
const fontsPromise = Promise.all([
  font('SofiaSansExtraCondensed-ExtraBold.ttf'),
  font('SofiaSans-Medium.ttf'),
]).then(([display, text]) => [
  {
    name: 'Display',
    data: display,
    weight: 800 as const,
    style: 'normal' as const,
  },
  { name: 'Text', data: text, weight: 500 as const, style: 'normal' as const },
])

const domain = (url: string) => new URL(url).host.replace(/^www\./, '')

export async function projectOgImage(p: Project, siteHost: string) {
  const fonts = await fontsPromise
  const size = p.za.length > 9 ? 190 : 240
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: fillHex(p.hue),
        color: INK,
        padding: '64px 72px',
        fontFamily: 'Text',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 48 }}>онова за</div>
        <div
          style={{
            fontFamily: 'Display',
            fontSize: size,
            lineHeight: 0.9,
            letterSpacing: -2,
            marginTop: 8,
          }}
        >
          {p.za}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 48 }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ fontSize: 40 }}>{p.name}</div>
          <div style={{ fontSize: 30, opacity: 0.78, marginTop: 6 }}>
            {p.pitch}
          </div>
        </div>
        <div style={{ fontSize: 28, opacity: 0.78 }}>
          {p.links.live ? domain(p.links.live) : siteHost}
        </div>
      </div>
    </div>,
    { ...ogSize, fonts },
  )
}

export async function siteOgImage(projects: readonly Project[]) {
  const fonts = await fontsPromise
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: INK,
        color: PAPER,
        padding: '64px 72px',
        fontFamily: 'Text',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontFamily: 'Display',
            fontSize: 210,
            lineHeight: 0.9,
            letterSpacing: -2,
          }}
        >
          онова за
        </div>
        <div style={{ fontSize: 40, marginTop: 20, opacity: 0.86 }}>
          Малки приложения и сайтове. Всяко е за нещо.
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {projects.map((p) => (
          <div
            key={p.slug}
            style={{
              display: 'flex',
              background: fillHex(p.hue),
              color: INK,
              fontFamily: 'Display',
              fontSize: 44,
              padding: '4px 16px 8px',
              borderRadius: 3,
            }}
          >
            {p.za}
          </div>
        ))}
      </div>
    </div>,
    { ...ogSize, fonts },
  )
}

// The mark: "за", the brand's own preposition, in the display face.
export async function markImage(px: number, pad: number) {
  const fonts = await fontsPromise
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: INK,
        color: PAPER,
        fontFamily: 'Display',
        fontSize: px * 0.78,
        lineHeight: 1,
        paddingBottom: pad,
      }}
    >
      за
    </div>,
    { width: px, height: px, fonts },
  )
}
