const PLAN_RANK = {
  free: 0,
  student: 1,
  basic: 2,
  standard: 3,
  premium: 4,
}

export function getPlanRank(plan) {
  return PLAN_RANK[plan] ?? 0
}

export const PLAN_FEATURES = {
  free: { maxResolution: 480, maxResolutionLabel: '480p', concurrentScreens: 1, downloads: false, adFree: false, skipsPerHour: 6, bingePass: true },
  student: { maxResolution: 720, maxResolutionLabel: '720p', concurrentScreens: 1, downloads: 1, adFree: false, skipsPerHour: 6, bingePass: false },
  basic: { maxResolution: 720, maxResolutionLabel: '720p', concurrentScreens: 1, downloads: 1, adFree: false, skipsPerHour: 6, bingePass: false },
  standard: { maxResolution: 1080, maxResolutionLabel: '1080p', concurrentScreens: 2, downloads: 2, adFree: true, skipsPerHour: 999, bingePass: false },
  premium: { maxResolution: 2160, maxResolutionLabel: '4K', concurrentScreens: 4, downloads: 6, adFree: true, skipsPerHour: 999, bingePass: false },
}
