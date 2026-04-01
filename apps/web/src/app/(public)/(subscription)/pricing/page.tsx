import { redirect } from 'next/navigation';

import PricingClient from '~/components/landing/pricing-client';
import { getServerAuthUser } from '~/utils/trpc-server';

export default async function PricingPage() {
  try {
    const user = await getServerAuthUser();
    return <PricingClient user={user} />;
  } catch {
    redirect('/invalid-upgrade-link');
  }
}
