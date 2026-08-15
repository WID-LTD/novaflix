import ProviderEngine from './providers/ProviderEngine.js'

import xpassProvider from './providers/xpass-provider.js'
import nextgenProvider from './providers/nextgen-provider.js'
import vidsrcProvider from './providers/vidsrc-provider.js'
import xembedProvider from './providers/xembed-provider.js'
import embedapiProvider from './providers/embedapi-provider.js'
import vidsrcpmProvider from './providers/vidsrcpm-provider.js'
import embedProvider from './providers/embed-provider.js'

const engine = new ProviderEngine()

engine.register(nextgenProvider)
engine.register(xpassProvider)
engine.register(vidsrcProvider)
engine.register(xembedProvider)
engine.register(embedapiProvider)
engine.register(vidsrcpmProvider)
engine.register(embedProvider)

export async function getStreamUrl(tmdbId, type = 'movie', season = null, episode = null) {
  const result = await engine.resolve(tmdbId, type, season, episode)

  if (!result.success || (!result.streamUrl && !result.embedUrl)) {
    throw new Error(result.error || 'No stream source available')
  }

  return {
    streamUrl: result.streamUrl || null,
    embedUrl: result.embedUrl || null,
    directUrl: result.streamUrl || null,
    subtitles: result.subtitles || [],
    provider: result.provider,
    providerMode: result.providerMode || (result.streamUrl ? 'hls' : 'embed'),
    backups: result.backups || [],
    fromCache: result.fromCache || false,
    elapsed: result.elapsed || 0,
    attempted: result.attempted || 0,
    totalProviders: result.totalProviders || 0,
  }
}

export async function closeBrowser() {}
