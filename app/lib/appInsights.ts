'use client';
import { ApplicationInsights }from '@microsoft/applicationinsights-web';

let appInsights: ApplicationInsights | null = null;

export function getAppInsights(): ApplicationInsights | null {
  return appInsights;
}

export function initAppInsights(): void {
  const connectionString = process.env.NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING;
  if (!connectionString || appInsights) return;

  appInsights = new ApplicationInsights({
    config: {
      connectionString,
      enableAutoRouteTracking: true,
      disableAjaxTracking: false,
      autoTrackPageVisitTime: true,
      enableCorsCorrelation: true,
      enableRequestHeaderTracking: true,
      enableResponseHeaderTracking: true,
    },
  });

  appInsights.loadAppInsights();
  appInsights.trackPageView();
}
