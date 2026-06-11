import React from 'react'
import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import WebGLWorldMap from './WebGLWorldMap.js'

// Phase 22 — Task 22.7 RED contract for WebGLWorldMap. Mirrors the
// WebGLConstellation mock pattern: jsdom has no real WebGL, so we stub
// WebGLRenderer + TextureLoader via vi.mock('three', importOriginal) while
// passing through PerspectiveCamera, Scene, Sprite, Mesh, etc. so the test
// can spy on real constructions through tracked instance arrays.

const rendererInstances = []
const cameraInstances = []
const spriteInstances = []
const meshInstances = []
const textureLoads = []
const disposedGeometries = []
const disposedMaterials = []
const disposedTextures = []

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal()

  class TrackedPerspectiveCamera extends actual.PerspectiveCamera {
    constructor(...args) {
      super(...args)
      cameraInstances.push({ args, instance: this })
    }
  }

  class TrackedSprite extends actual.Sprite {
    constructor(...args) {
      super(...args)
      spriteInstances.push(this)
    }
  }

  class TrackedMesh extends actual.Mesh {
    constructor(...args) {
      super(...args)
      meshInstances.push(this)
    }
  }

  class TrackedPlaneGeometry extends actual.PlaneGeometry {
    constructor(...args) {
      super(...args)
      const realDispose = this.dispose.bind(this)
      this.dispose = vi.fn(() => {
        disposedGeometries.push(this)
        realDispose()
      })
    }
  }

  class TrackedMeshBasicMaterial extends actual.MeshBasicMaterial {
    constructor(...args) {
      super(...args)
      const realDispose = this.dispose.bind(this)
      this.dispose = vi.fn(() => {
        disposedMaterials.push(this)
        realDispose()
      })
    }
  }

  class TrackedSpriteMaterial extends actual.SpriteMaterial {
    constructor(...args) {
      super(...args)
      const realDispose = this.dispose.bind(this)
      this.dispose = vi.fn(() => {
        disposedMaterials.push(this)
        realDispose()
      })
    }
  }

  class FakeTexture {
    constructor() {
      this.dispose = vi.fn(() => { disposedTextures.push(this) })
      this.image = { width: 64, height: 64 }
      this.needsUpdate = false
    }
  }

  class TrackedTextureLoader {
    // eslint-disable-next-line class-methods-use-this
    load(url, onLoad) {
      textureLoads.push(url)
      const tex = new FakeTexture()
      if (typeof onLoad === 'function') onLoad(tex)
      return tex
    }
  }

  return {
    ...actual,
    PerspectiveCamera: TrackedPerspectiveCamera,
    Sprite: TrackedSprite,
    Mesh: TrackedMesh,
    PlaneGeometry: TrackedPlaneGeometry,
    MeshBasicMaterial: TrackedMeshBasicMaterial,
    SpriteMaterial: TrackedSpriteMaterial,
    TextureLoader: TrackedTextureLoader,
    WebGLRenderer: vi.fn(() => {
      const inst = {
        setSize: vi.fn(),
        setPixelRatio: vi.fn(),
        render: vi.fn(),
        domElement: document.createElement('canvas'),
        dispose: vi.fn(),
      }
      rendererInstances.push(inst)
      return inst
    }),
  }
})

const FIXTURE = {
  worlds: [
    {
      id: 'company:acme',
      type: 'company',
      label: 'Acme',
      biome: 'selva',
      position: { x: 100, y: 100 },
      levels: [{
        title: { en: 'Dev', es: 'Dev' },
        period: { start: 2019, end: 2020 },
        bullets: { en: [], es: [] },
        tech: [],
      }],
    },
    {
      id: 'section:about',
      type: 'section',
      label: { en: 'About', es: 'Sobre' },
      biome: 'pradera',
      position: { x: 500, y: 500 },
      content: { en: 'a', es: 'a' },
    },
    {
      id: 'secret:s1',
      type: 'secret',
      label: { en: 'Hidden', es: 'Oculto' },
      biome: 'cyber',
      position: { x: 0, y: 0 },
      command: '/x',
      content: { en: 'h', es: 'h' },
      hidden: true,
    },
  ],
}

let getContextSpy

beforeEach(() => {
  getContextSpy = vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue({})
  rendererInstances.length = 0
  cameraInstances.length = 0
  spriteInstances.length = 0
  meshInstances.length = 0
  textureLoads.length = 0
  disposedGeometries.length = 0
  disposedMaterials.length = 0
  disposedTextures.length = 0
})

afterEach(() => {
  cleanup()
  getContextSpy.mockRestore()
  vi.clearAllMocks()
})

describe('WebGLWorldMap Phase 22 — Task 22.7 contract', () => {
  it('mounts a <canvas> into the container', () => {
    const { container } = render(<WebGLWorldMap worldsData={FIXTURE} />)
    expect(container.querySelector('canvas')).toBeTruthy()
  })

  it('creates PerspectiveCamera with fov=55, near=10, far=2000', () => {
    render(<WebGLWorldMap worldsData={FIXTURE} />)
    expect(cameraInstances.length).toBeGreaterThanOrEqual(1)
    const [fov, , near, far] = cameraInstances[0].args
    expect(fov).toBe(55)
    expect(near).toBe(10)
    expect(far).toBe(2000)
  })

  it('creates one biome plane mesh per BIOMES entry (5 biomes)', () => {
    render(<WebGLWorldMap worldsData={FIXTURE} />)
    // 5 biome planes minimum (impl may add more meshes for other purposes)
    expect(meshInstances.length).toBeGreaterThanOrEqual(5)
  })

  it('creates one Sprite per visible world plus the avatar (2 visible + 1 avatar = 3)', () => {
    render(<WebGLWorldMap worldsData={FIXTURE} />)
    // 2 visible worlds (acme + about) + 1 avatar sprite = 3
    expect(spriteInstances.length).toBeGreaterThanOrEqual(3)
  })

  it('loads the avatar sprite texture from /sprites/avatar-carlos-walk path', () => {
    render(<WebGLWorldMap worldsData={FIXTURE} />)
    const hasAvatar = textureLoads.some((u) => u.includes('avatar-carlos-walk'))
    expect(hasAvatar).toBe(true)
  })

  it('pointerdown + pointerup at canvas center fires onWorldSelect with a visible world id', () => {
    const onWorldSelect = vi.fn()
    const { container } = render(
      <WebGLWorldMap worldsData={FIXTURE} onWorldSelect={onWorldSelect} />,
    )
    const canvas = container.querySelector('canvas')
    canvas.getBoundingClientRect = () => ({
      left: 0, top: 0, width: 1000, height: 1000, right: 1000, bottom: 1000,
    })
    canvas.setPointerCapture = () => {}
    canvas.releasePointerCapture = () => {}
    // section:about sits at world position (500,500) = CANVAS_CENTER, so
    // its scene position is (0,0,0) → projects to NDC origin under the
    // camera at (0,0,600) lookAt (0,0,0) — center click lands on it.
    // jsdom 25 PointerEvent drops clientX/Y on the synthetic init payload, so
    // dispatch as a MouseEvent typed 'pointerdown'/'pointerup' — React listens
    // by event type, not class, and MouseEvent honors clientX/Y in init.
    canvas.dispatchEvent(new MouseEvent('pointerdown', {
      bubbles: true, cancelable: true, clientX: 500, clientY: 500,
    }))
    canvas.dispatchEvent(new MouseEvent('pointerup', {
      bubbles: true, cancelable: true, clientX: 500, clientY: 500,
    }))
    expect(onWorldSelect).toHaveBeenCalled()
    const calledWith = onWorldSelect.mock.calls[0][0]
    expect(['company:acme', 'section:about']).toContain(calledWith)
  })

  it('webglcontextlost on canvas calls onContextLost', () => {
    const onContextLost = vi.fn()
    const { container } = render(
      <WebGLWorldMap worldsData={FIXTURE} onContextLost={onContextLost} />,
    )
    const canvas = container.querySelector('canvas')
    const evt = new Event('webglcontextlost', { cancelable: true })
    canvas.dispatchEvent(evt)
    expect(onContextLost).toHaveBeenCalled()
  })

  it('does not throw when a resize event fires on the window after mount', () => {
    const { container } = render(<WebGLWorldMap worldsData={FIXTURE} />)
    expect(container.querySelector('canvas')).toBeTruthy()
    expect(() => {
      window.dispatchEvent(new Event('resize'))
    }).not.toThrow()
  })

  it('disposes renderer + geometries + materials on unmount', () => {
    const { unmount } = render(<WebGLWorldMap worldsData={FIXTURE} />)
    const renderer = rendererInstances[rendererInstances.length - 1]
    unmount()
    expect(renderer.dispose).toHaveBeenCalled()
    expect(disposedGeometries.length).toBeGreaterThan(0)
    expect(disposedMaterials.length).toBeGreaterThan(0)
  })

  it('hidden secret worlds do NOT render a sprite when unlockedSecrets is empty', () => {
    render(<WebGLWorldMap worldsData={FIXTURE} unlockedSecrets={[]} />)
    // 2 visible worlds + 1 avatar = exactly 3 (the secret:s1 is hidden)
    const baseline = spriteInstances.length
    expect(baseline).toBe(3)
  })

  it('unlockedSecrets reveals the hidden world — sprite count increases by 1', () => {
    spriteInstances.length = 0
    render(<WebGLWorldMap worldsData={FIXTURE} unlockedSecrets={[]} />)
    const baseline = spriteInstances.length
    spriteInstances.length = 0
    render(<WebGLWorldMap worldsData={FIXTURE} unlockedSecrets={['s1']} />)
    const unlocked = spriteInstances.length
    expect(unlocked).toBe(baseline + 1)
  })

  it('renders and unmounts cleanly with default props (no rAF, no crash)', () => {
    const { unmount } = render(<WebGLWorldMap worldsData={FIXTURE} />)
    expect(() => unmount()).not.toThrow()
  })
})
