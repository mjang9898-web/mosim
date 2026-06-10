// Mosim — privacy-safe PostHog analytics.
// Captures ONLY anonymous pageviews + traffic source (referrer/UTM) for the marketing
// funnel. Autocapture is OFF and session recording is OFF, so medical selections, the
// free-text note, and any PII are NEVER sent. The funnel (/step1→…→/result) and source
// attribution are built from pageviews alone. Loaded site-wide except the admin cockpit.
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init('phc_zN5eumm2xjCqbyignwMwTZov7vJcRc6Pj9BJiAuBFdTb', {
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'never',          // fully anonymous — no identified persons / no PII
  autocapture: false,                // no auto click/text capture → medical selections never sent
  capture_pageview: true,            // pageviews drive the funnel
  capture_pageleave: true,
  disable_session_recording: true,   // no screen recording on a medical site (can enable later w/ masking)
  rageclick: false,
  respect_dnt: true                  // honor Do-Not-Track
});
