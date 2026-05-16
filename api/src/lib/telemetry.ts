import * as appInsights from 'applicationinsights';

let initialized = false;

export function initTelemetry(): void {
  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
  if (!connectionString || initialized) return;

  appInsights
    .setup(connectionString)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true, true)
    .setUseDiskRetryCaching(false)
    .setSendLiveMetrics(false)
    .start();

  initialized = true;
}

export function trackEvent(name: string, properties?: Record<string, string>): void {
  if (!initialized) return;
  appInsights.defaultClient?.trackEvent({ name, properties });
}

export function trackException(error: Error, properties?: Record<string, string>): void {
  if (!initialized) return;
  appInsights.defaultClient?.trackException({ exception: error, properties });
}
