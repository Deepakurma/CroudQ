import { Linking } from "react-native";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const getWebUrl = () => trimTrailingSlash(process.env.EXPO_PUBLIC_WEB_URL?.trim() || "");

const openWebPath = async (path: string) => {
  await Linking.openURL(`${getWebUrl()}${path}`);
};

export const openPrivacyPolicy = () => openWebPath("/privacy-policy");

export const openTermsOfService = () => openWebPath("/terms-of-service");
