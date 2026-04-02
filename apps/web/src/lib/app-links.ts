const IOS_BUNDLE_IDENTIFIER = 'com.croudq.app';
const ANDROID_PACKAGE_NAME = 'com.croudq.app';

const parseCommaSeparatedValues = (value?: string) =>
  (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

export const getIosAppLinkConfig = () => {
  const appleTeamId = process.env.APPLE_TEAM_ID?.trim();

  if (!appleTeamId) {
    return null;
  }

  return {
    appID: `${appleTeamId}.${IOS_BUNDLE_IDENTIFIER}`,
    paths: ['/reset-password', '/reset-password/*']
  };
};

export const getAndroidAppLinkConfig = () => {
  const fingerprints = parseCommaSeparatedValues(process.env.ANDROID_SHA256_CERT_FINGERPRINTS);

  if (fingerprints.length === 0) {
    return null;
  }

  return {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: ANDROID_PACKAGE_NAME,
      sha256_cert_fingerprints: fingerprints
    }
  };
};
