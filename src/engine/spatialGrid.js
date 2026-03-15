// Spatial hash grid for efficient collision detection
// Reduces collision checks from O(n^2) to ~O(n) by only checking nearby particles

export class SpatialGrid {
  constructor(cellSize, width, height) {
    this.cellSize = cellSize
    this.cols = Math.ceil(width / cellSize)
    this.rows = Math.ceil(height / cellSize)
    this.cells = new Map()
  }

  clear() {
    this.cells.clear()
  }

  _key(cx, cy) {
    return cx * 10000 + cy
  }

  insert(particle) {
    const cx = Math.floor(particle.x / this.cellSize)
    const cy = Math.floor(particle.y / this.cellSize)
    particle.cellX = cx
    particle.cellY = cy

    const key = this._key(cx, cy)
    if (!this.cells.has(key)) {
      this.cells.set(key, [])
    }
    this.cells.get(key).push(particle)
  }

  // Get all particles in same and adjacent cells
  getNearby(particle) {
    const cx = particle.cellX
    const cy = particle.cellY
    const nearby = []

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = this._key(cx + dx, cy + dy)
        const cell = this.cells.get(key)
        if (cell) {
          for (const p of cell) {
            if (p.id !== particle.id && p.alive) {
              nearby.push(p)
            }
          }
        }
      }
    }

    return nearby
  }

  // Get all unique pairs of particles that could collide
  getPotentialPairs() {
    const pairs = new Set()
    const result = []

    for (const [, cell] of this.cells) {
      for (const particle of cell) {
        if (!particle.alive) continue
        const nearby = this.getNearby(particle)
        for (const other of nearby) {
          const pairId = particle.id < other.id
            ? `${particle.id}-${other.id}`
            : `${other.id}-${particle.id}`
          if (!pairs.has(pairId)) {
            pairs.add(pairId)
            result.push([particle, other])
          }
        }
      }
    }

    return result
  }

  resize(width, height) {
    this.cols = Math.ceil(width / this.cellSize)
    this.rows = Math.ceil(height / this.cellSize)
  }
}
