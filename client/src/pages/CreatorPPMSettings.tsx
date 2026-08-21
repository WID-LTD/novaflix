import { useEffect, useState } from 'react'
import { getPPMConfig, updateCreatorBaseRate, getPPMRate } from '../lib/auth'
import { useToast } from '../components/ui/Toast'
import Layout from '../components/layout/Layout'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { motion } from 'framer-motion'
import { TIER_PARAMS } from '../lib/constants' // We'll define this

export default function CreatorPPMSettings() {
  const toast = useToast()
  const [config, setConfig] = useState(null)
  const [baseRate, setBaseRate] = useState('')
  const [saving, setSaving] = useState(false)
  const [previewRate, setPreviewRate] = useState(null)
  const [tier, setTier] = useState('student')

  const TIER_PARAMS_LOCAL = {
    student: { min_ppm: 5, max_ppm: 100, multiplier: 0.75, price: 800 },
    basic: { min_ppm: 5, max_ppm: 200, multiplier: 1.0, price: 1500 },
    standard: { min_ppm: 10, max_ppm: 300, multiplier: 1.25, price: 2500 },
    premium: { min_ppm: 20, max_ppm: 500, multiplier: 1.5, price: 5500 }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const [configRes, rateRes] = await Promise.all([
        getPPMConfig(),
        getPPMRate({ contentType: 'movie' })
      ])
      if (configRes.success) {
        setConfig(configRes.config)
        setBaseRate(configRes.config.base_rate)
      }
      if (rateRes.success) {
        setPreviewRate(rateRes.dynamicRate)
        setTier(rateRes.tier)
      }
    } catch (err) {
      console.error('Load PPM config error:', err)
    }
  }

  const handleSave = async () => {
    if (!baseRate) return
    setSaving(true)
    try {
      const res = await updateCreatorBaseRate(baseRate)
      if (res.success) {
        toast.success('PPM base rate updated')
        loadConfig()
      } else {
        toast.error(res.error || 'Failed to update')
      }
    } catch (err) {
      toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const calculatePreview = (rate) => {
    const tierParams = TIER_PARAMS_LOCAL[tier]
    if (!tierParams) return null
    // For uploads: use base rate directly (clamped)
    // For scraped: baseline * multiplier
    // We'll show both
    const clamped = Math.min(Math.max(parseFloat(rate) || 0, tierParams.min_ppm), tierParams.max_ppm)
    return {
      uploadRate: clamped,
      scrapedRate: Math.min(Math.max(2.0 * tierParams.multiplier, tierParams.min_ppm), tierParams.max_ppm),
      shortsRate: Math.min(Math.max(0.2 * tierParams.multiplier, tierParams.min_ppm), tierParams.max_ppm)
    }
  }

  useEffect(() => {
    if (baseRate) {
      setPreviewRate(calculatePreview(baseRate))
    }
  }, [baseRate, tier])

  const tierConfig = TIER_PARAMS_LOCAL[tier]

  return (
    <Layout>
      <div className="min-h-screen px-4 md:px-8 py-6 md:py-10 pb-nav">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-headline-lg font-bold mb-2">PPM Settings</h1>
            <p className="text-body-md text-on-surface-variant">
              Configure your pay-per-minute base rate. This applies to your direct uploads.
              Scraped/YouTube content uses dynamic rates based on platform VPM.
            </p>
          </div>

          {/* Current Tier Badge */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="bg-primary-container/10 border border-primary/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center">
                    <Icon name="trending_up" className="w-6 h-6 text-on-primary-container" />
                  </div>
                  <div>
                    <h3 className="font-label-lg text-on-surface">Current Tier: {tier.charAt(0).toUpperCase() + tier.slice(1)}</h3>
                    <p className="text-body-sm text-on-surface-variant">₦{TIER_PARAMS_LOCAL[tier].price}/month</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-surface-container rounded-xl p-3">
                    <p className="text-label-sm text-on-surface-variant">Min PPM</p>
                    <p className="text-headline-sm font-bold text-on-surface">₦{tierConfig.min_ppm}</p>
                  </div>
                  <div className="bg-surface-container rounded-xl p-3">
                    <p className="text-label-sm text-on-surface-variant">Max PPM</p>
                    <p className="text-headline-sm font-bold text-on-surface">₦{tierConfig.max_ppm}</p>
                  </div>
                  <div className="bg-surface-container rounded-xl p-3">
                    <p className="text-label-sm text-on-surface-variant">Multiplier</p>
                    <p className="text-headline-sm font-bold text-primary">{tierConfig.multiplier}x</p>
                  </div>
                </div>
              </div>
            </motion.div>

          {/* Base Rate Setting */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
            <div className="bg-surface-container-high border border-white/5 rounded-2xl p-6">
              <h3 className="font-label-lg text-on-surface mb-4 flex items-center gap-2">
                <Icon name="tune" className="text-primary-container" /> Base Rate (₦/min)
              </h3>
              <p className="text-body-sm text-on-surface-variant mb-6">
                This rate applies to your direct uploads. Scraped content earnings are calculated dynamically 
                using the platform's baseline VPM × your tier multiplier ({tierConfig.multiplier}x).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-on-surface-variant text-sm mb-1.5 block">
                    <Icon name="tune" size="sm" className="inline mr-1.5" /> Base Rate (₦/min)
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter base rate"
                    value={baseRate}
                    onChange={(e) => setBaseRate(e.target.value)}
                    min={tierConfig.min_ppm}
                    max={tierConfig.max_ppm}
                    step={0.5}
                    required
                  />
                  <p className="text-xs text-on-surface-variant/60 mt-1">
                    Range: ₦{tierConfig.min_ppm} - ₦{tierConfig.max_ppm}
                  </p>
                </div>

                <div>
                  <label className="text-on-surface-variant text-sm mb-1.5 block">
                    <Icon name="trending_up" size="sm" className="inline mr-1.5" /> Tier Multiplier
                  </label>
                  <div className="w-full bg-surface-variant/20 border border-outline/30 rounded-xl px-4 py-3 text-sm on-surface">
                    {tierConfig.multiplier}x (set by your {tier} subscription)
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              {previewRate && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 bg-primary-container/10 border border-primary/20 rounded-xl">
                  <h4 className="font-label-md text-on-surface mb-3 flex items-center gap-2">
                    <Icon name="preview" className="text-primary-container" /> Live Preview
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-surface-container rounded-xl p-4 text-center">
                      <p className="text-label-sm text-on-surface-variant">Your Uploads</p>
                      <p className="text-headline-md font-bold text-on-surface">₦{previewRate.uploadRate?.toFixed(2) || '0.00'}/min</p>
                      <p className="text-xs text-on-surface-variant/60 mt-1">Your base rate</p>
                    </div>
                    <div className="bg-surface-container rounded-xl p-4 text-center">
                      <p className="text-label-sm text-on-surface-variant">Scraped/YouTube</p>
                      <p className="text-headline-md font-bold text-primary">{previewRate.scrapedRate?.toFixed(2) || '0.00'}/min</p>
                      <p className="text-xs text-on-surface-variant/60 mt-1">Baseline × {tierConfig.multiplier}x</p>
                    </div>
                    <div className="bg-surface-container rounded-xl p-4 text-center">
                      <p className="text-label-sm text-on-surface-variant">Shorts</p>
                      <p className="text-headline-md font-bold text-primary">{previewRate.shortsRate?.toFixed(2) || '0.00'}/min</p>
                      <p className="text-xs text-on-surface-variant/60 mt-1">Baseline × {tierConfig.multiplier}x</p>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant/60 mt-3 text-center">
                    Scraped rates update hourly based on platform VPM. Your tier multiplier: {tierConfig.multiplier}x
                  </p>
                </motion.div>
              )}

              <Button onClick={handleSave} size="lg" className="w-full" loading={saving} disabled={!baseRate}>
                <Icon name="save" size="sm" className="mr-2" />
                {saving ? 'Saving...' : 'Save Base Rate'}
              </Button>
            </div>
          </motion.div>

          {/* Tier Comparison */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h3 className="font-label-lg text-on-surface mb-4 flex items-center gap-2">
              <Icon name="compare" className="text-primary-container" /> Tier Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-label-sm text-on-surface-variant">
                    <th className="p-4 text-left">Tier</th>
                    <th className="p-4 text-center">Monthly</th>
                    <th className="p-4 text-center">Min PPM</th>
                    <th className="p-4 text-center">Max PPM</th>
                    <th className="p-4 text-center">Multiplier</th>
                    <th className="p-4 text-center">Upload Rate Range</th>
                    <th className="p-4 text-center">Scraped Rate (est.)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(TIER_PARAMS_LOCAL).map(([key, t]) => (
                    <tr key={key} className={`border-b border-white/5 ${key === tier ? 'bg-primary-container/5' : ''}`}>
                      <td className="p-4 font-medium text-on-surface">{key.charAt(0).toUpperCase() + key.slice(1)}</td>
                      <td className="p-4 text-center text-on-surface-variant">₦{t.price.toLocaleString()}</td>
                      <td className="p-4 text-center text-on-surface">₦{t.min_ppm}</td>
                      <td className="p-4 text-center text-on-surface">₦{t.max_ppm}</td>
                      <td className="p-4 text-center font-bold text-primary">{t.multiplier}x</td>
                      <td className="p-4 text-center text-on-surface">₦{t.min_ppm} - ₦{t.max_ppm}</td>
                      <td className="p-4 text-center text-primary">
                        ~₦{(2.0 * t.multiplier).toFixed(2)} - ₦{(0.2 * t.multiplier).toFixed(2)}/min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8 p-4 bg-surface-container-high border border-white/5 rounded-2xl">
            <h4 className="font-label-md text-on-surface mb-3 flex items-center gap-2">
              <Icon name="info" className="text-primary-container" /> How It Works
            </h4>
            <ul className="space-y-2 text-body-sm text-on-surface-variant">
              <li className="flex items-center gap-2"><Icon name="check_circle" className="w-4 h-4 text-primary-container flex-shrink-0" /> Your <strong>base rate</strong> applies to direct uploads (clamped to your tier limits)</li>
              <li className="flex items-center gap-2"><Icon name="check_circle" className="w-4 h-4 text-primary-container flex-shrink-0" /> <strong>Scraped/YouTube content</strong> earns dynamically: <code>Platform VPM × Your Tier Multiplier</code>, then clamped to your tier limits</li>
              <li className="flex items-center gap-2"><Icon name="check_circle" className="w-4 h-4 text-primary-container flex-shrink-0" /> <strong>Shorts</strong> use the Shorts pool VPM (typically lower) × your tier multiplier</li>
              <li className="flex items-center gap-2"><Icon name="check_circle" className="w-4 h-4 text-primary-container flex-shrink-0" /> <strong>Live streams</strong> are saved as shorts and earn Shorts pool rates</li>
              <li className="flex items-center gap-2"><Icon name="check_circle" className="w-4 h-4 text-primary-container flex-shrink-0" /> Platform VPM updates <strong>hourly</strong> based on total pool revenue ÷ total minutes watched</li>
              <li className="flex items-center gap-2"><Icon name="check_circle" className="w-4 h-4 text-primary-container flex-shrink-0" /> Upgrade your subscription to unlock higher floors, ceilings, and multipliers</li>
            </ul>
          </motion.div>
        </div>
      </Layout>
    )
  }
}