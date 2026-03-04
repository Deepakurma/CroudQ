import { Building2, Heart, Shield, Users } from 'lucide-react';

import { Card, CardContent } from '~/shared/shadcn/card';

export default function AboutUsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl">
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">About Bunkezy</h1>
          <p className="text-muted-foreground sm:text-md mx-auto max-w-2xl text-sm">
            Reimagining student and professional living with premium, hassle-free hostel
            experiences.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
          <Card className="rounded-3xl">
            <CardContent className="space-y-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-2xl">
                <Building2 className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                To provide safe, comfortable, and modern living spaces that allow our residents to
                focus on their goals without worrying about the daily chores of accommodation.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardContent className="space-y-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-2xl">
                <Users className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Community First</h3>
              <p className="text-muted-foreground leading-relaxed">
                We believe in fostering vibrant communities. Our spaces are designed to encourage
                interaction, networking, and lifelong friendships among diverse individuals.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardContent className="space-y-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-2xl">
                <Shield className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Uncompromised Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your safety is our priority. With 24/7 surveillance, biometric entry, and secure
                premises, we ensure a worry-free environment for all our residents.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardContent className="space-y-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-2xl">
                <Heart className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Premium Comfort</h3>
              <p className="text-muted-foreground leading-relaxed">
                From high-speed WiFi to nutritious meals and regular housekeeping, we take care of
                the essentials so you can experience comfortable, premium living.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="prose prose-slate dark:prose-invert text-muted-foreground max-w-none space-y-4">
          <h2 className="text-foreground text-2xl font-semibold tracking-tight">Our Story</h2>
          <p className="leading-relaxed">
            Founded with a vision to organize the fragmented hostel sector, Bunkezy started as a
            solution to the common problems faced by students and working professionals migrating to
            new cities. We noticed the lack of transparency, substandard living conditions, and
            unpredictable amenities in traditional paying guest accommodations.
          </p>
          <p className="leading-relaxed">
            Today, Bunkezy is building a network of premium hostels that guarantee quality,
            security, and a vibrant community. Whether you're a student preparing for exams or a
            professional starting a new job, Bunkezy is your trusted partner for a comfortable stay
            away from home.
          </p>
        </div>
      </div>
    </main>
  );
}
