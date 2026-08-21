import { cacheGet, cacheSet } from './cache.js'

const STREAM_PRIORITY_MAX = 5
const BACKUP_GRACE_MS = 6000
const STREAM_SETTLE_MS = 15000

export default class ProviderEngine {
  constructor() {
    this.streamProviders = []
  }

  register(provider) {
    this.streamProviders.push(provider)
    this.streamProviders.sort((a, b) => (a.priority || 99) - (b.priority || 99))
  }

  async resolve(tmdbId, type = 'movie', season = null, episode = null) {
    const cacheKey = `${tmdbId}:${type}:${season || ''}:${episode || ''}`
    const cached = cacheGet(cacheKey)
    if (cached) {
      console.log(`[engine] CACHE HIT for ${cacheKey}`)
      return { ...cached, fromCache: true }
    }

    const startTime = Date.now()
    const allResults = []

    const result = await this.tryStreams(tmdbId, type, season, episode, allResults, startTime)
    if (result) {
      const output = this.buildOutput(result, allResults, startTime)
      cacheSet(cacheKey, output)
      return output
    }

    return { success: false, error: 'No provider returned a stream', elapsed: Date.now() - startTime }
  }

  async tryStreams(tmdbId, type, season, episode, allResults, startTime) {
    if (this.streamProviders.length === 0) return null

    let resolveWinner
    const winnerPromise = new Promise(r => { resolveWinner = r })

    const tasks = this.streamProviders.map(p =>
      this.runProvider(p, tmdbId, type, season, episode, allResults).then(r => {
        if (r?.streamUrl) resolveWinner(r)
      })
    )

    const settled = Promise.allSettled(tasks)
    const firstStream = await Promise.race([
      winnerPromise,
      new Promise(r => setTimeout(() => r(null), STREAM_SETTLE_MS)),
      settled.then(() => null),
    ])

    // Give slower providers a short window to contribute backup streams after a
    // winner is found, so the probe/failover in source() has real alternatives.
    if (firstStream) {
      await Promise.race([settled, new Promise(r => setTimeout(r, BACKUP_GRACE_MS))])
    }

    // Prefer the highest-priority provider that actually returned a stream,
    // instead of the fastest-to-resolve. A fast-but-broken provider (e.g. one
    // serving ad placeholders) must not always win the race.
    const streamResults = allResults.filter(r => r.streamUrl)
    if (streamResults.length > 0) {
      streamResults.sort((a, b) => (a.priority || 99) - (b.priority || 99))
      return streamResults[0]
    }

    if (allResults.length > 0) {
      const best = allResults.find(r => r.streamUrl) || allResults[0]
      return best
    }
    return null
  }

  async runProvider(p, tmdbId, type, season, episode, allResults) {
    const pStart = Date.now()
    try {
      const result = await p.resolve(tmdbId, type, season, episode)
      const elapsed = Date.now() - pStart
      if (result?.streamUrl) {
        result.provider = p.name
        result.priority = p.priority || 99
        result.elapsed = elapsed
        allResults.push(result)
        console.log(`[engine] ${p.name} -> ✅ stream (${elapsed}ms)`)
        return result
      }
      console.log(`[engine] ${p.name} -> ❌ (${elapsed}ms)`)
    } catch (e) {
      console.log(`[engine] ${p.name} error: ${e.message?.slice(0, 80)}`)
    }
    return null
  }

  buildOutput(winner, allResults, startTime) {
    const elapsed = Date.now() - startTime
    return {
      success: true,
      streamUrl: winner.streamUrl || null,
      directUrl: winner.streamUrl || null,
      subtitles: winner.subtitles || [],
      provider: winner.provider,
      providerMode: 'hls',
      backups: allResults
        .filter(r => r !== winner)
        .slice(0, 5)
        .map(r => ({
          streamUrl: r.streamUrl,
          provider: r.provider,
          elapsed: r.elapsed,
          subtitles: r.subtitles || [],
        })),
      totalProviders: this.streamProviders.length,
      attempted: allResults.length,
      elapsed,
    }
  }
}
