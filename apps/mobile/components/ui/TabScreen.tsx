import { AppScreen, type AppScreenProps } from "@/components/ui/AppScreen";

type TabScreenProps = Omit<AppScreenProps, "bottomInsetBehavior">;

export function TabScreen(props: TabScreenProps) {
  return <AppScreen bottomInsetBehavior="tab-bar" {...props} />;
}
