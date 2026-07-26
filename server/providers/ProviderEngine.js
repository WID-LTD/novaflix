import { cacheGet, cacheSet } from './cache.js'

const STREAM_PRIORITY_MAX = 5

export default class ProviderEngine {
  constructor() {
    this.streamProviders = []
    this.embedProviders = []
  }

  register(provider) {
    const priority = provider.priority || 99
    if (priority <= STREAM_PRIORITY_MAX) {
      this.streamProviders.push(provider)
      this.streamProviders.sort((a, b) => (a.priority || 99) - (b.priority || 99))
    } else {
      this.embedProviders.push(provider)
      this.embedProviders.sort((a, b) => (a.priority || 99) - (b.priority || 99))
    }
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

    const embedResult = await this.tryEmbeds(tmdbId, type, season, episode, allResults, startTime)
    if (embedResult) {
      const output = this.buildOutput(embedResult, allResults, startTime)
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

    Promise.allSettled(tasks).then(() => resolveWinner(null))
    const winner = await winnerPromise
    if (winner) return winner

    if (allResults.length > 0) {
      const best = allResults.find(r => r.streamUrl) || allResults[0]
      return best
    }
    return null
  }

  async tryEmbeds(tmdbId, type, season, episode, allResults, startTime) {
    if (this.embedProviders.length === 0) return null

    let resolveWinner
    const winnerPromise = new Promise(r => { resolveWinner = r })

    const tasks = this.embedProviders.map(p =>
      this.runProvider(p, tmdbId, type, season, episode, allResults).then(r => {
        if (r) resolveWinner(r)
      })
    )

    Promise.allSettled(tasks).then(() => resolveWinner(null))
    return await winnerPromise
  }

  async runProvider(p, tmdbId, type, season, episode, allResults) {
    const pStart = Date.now()
    try {
      const result = await p.resolve(tmdbId, type, season, episode)
      const elapsed = Date.now() - pStart
      if (result?.streamUrl || result?.embedUrl) {
        result.provider = p.name
        result.elapsed = elapsed
        allResults.push(result)
        console.log(`[engine] ${p.name} -> ${result.streamUrl ? '✅ stream' : result.embedUrl ? '🔄 embed' : '❌'} (${elapsed}ms)`)
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
      embedUrl: winner.embedUrl || null,
      directUrl: winner.streamUrl || null,
      subtitles: winner.subtitles || [],
      provider: winner.provider,
      providerMode: winner.streamUrl ? 'hls' : 'embed',
      backups: allResults
        .filter(r => r !== winner)
        .slice(0, 5)
        .map(r => ({
          streamUrl: r.streamUrl,
          embedUrl: r.embedUrl,
          provider: r.provider,
          elapsed: r.elapsed,
          subtitles: r.subtitles || [],
        })),
      totalProviders: this.streamProviders.length + this.embedProviders.length,
      attempted: allResults.length,
      elapsed,
    }
  }
}
