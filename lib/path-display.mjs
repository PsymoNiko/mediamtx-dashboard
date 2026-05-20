export const ALL_OTHERS_PATH_NAME = "all_others"

function pathName(path) {
  return typeof path?.name === "string" ? path.name : ""
}

export function getConfiguredDashboardPaths(pathConfigs = []) {
  return pathConfigs.filter((path) => pathName(path) && pathName(path) !== ALL_OTHERS_PATH_NAME)
}

function describeRuntimeSource(path) {
  const sourceType = path?.source?.type

  return sourceType ? `Live ${sourceType} source` : "Live published stream"
}

export function buildDashboardPathRows(pathConfigs = [], livePaths = []) {
  const configuredPaths = getConfiguredDashboardPaths(pathConfigs).map((path) => ({
    ...path,
    runtimeOnly: false,
  }))
  const configuredNames = new Set(configuredPaths.map((path) => path.name))

  const runtimeOnlyPaths = livePaths
    .filter(
      (path) =>
        path?.ready && pathName(path) && !configuredNames.has(path.name) && path.name !== ALL_OTHERS_PATH_NAME,
    )
    .map((path) => ({
      name: path.name,
      source: describeRuntimeSource(path),
      runtimeOnly: true,
    }))

  return [...configuredPaths, ...runtimeOnlyPaths]
}

export function summarizeDashboardPaths(pathConfigs = [], livePaths = []) {
  const configuredPaths = getConfiguredDashboardPaths(pathConfigs)
  const configuredNames = new Set(configuredPaths.map((path) => path.name))
  const readyPathNames = new Set(
    livePaths
      .filter((path) => path?.ready && pathName(path) && path.name !== ALL_OTHERS_PATH_NAME)
      .map((path) => path.name),
  )
  const runtimeOnlyCount = livePaths.filter(
    (path) =>
      path?.ready && pathName(path) && path.name !== ALL_OTHERS_PATH_NAME && !configuredNames.has(path.name),
  ).length

  return {
    activeStreamsCount: readyPathNames.size,
    idleConfiguredCount: configuredPaths.filter((path) => !readyPathNames.has(path.name)).length,
    totalDashboardPathCount: configuredPaths.length + runtimeOnlyCount,
  }
}
