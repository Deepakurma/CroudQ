'use client';

import * as React from 'react';

import {
  AlertCircle,
  Bell,
  Building2,
  Eye,
  Merge,
  Send,
  Smartphone,
  Trash2,
  User2,
  Users2
} from 'lucide-react';
import { type DateRange } from 'react-day-picker';

import { Alert, AlertDescription } from '~/shared/shadcn/alert';
import { Badge } from '~/shared/shadcn/badge';
import { Button } from '~/shared/shadcn/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/shared/shadcn/card';
import { Checkbox } from '~/shared/shadcn/checkbox';
import { Label } from '~/shared/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/shared/shadcn/select';
import { Textarea } from '~/shared/shadcn/textarea';

import { DataTable } from '~/components/datatable';

import type { ColumnDef } from '@tanstack/react-table';

type SentTo = 'landlords' | 'users' | 'both';
type SentVia = 'in-app' | 'sms';

export interface Announcement {
  id: string;
  announcement: string;
  sentTo: SentTo;
  sentVia: SentVia;
  createdAt: Date;
}

const ANNOUNCEMENT_BADGE_CONFIG: Record<
  SentTo,
  {
    label: string;
    className: string;
    icon: React.ElementType;
  }
> = {
  landlords: {
    label: 'Landlords',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: Building2
  },
  users: {
    label: 'Users',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: User2
  },
  both: {
    label: 'Both',
    className: 'bg-orange-100 text-orange-500 border-orange-200',
    icon: Merge
  }
};

const renderAnnouncementBadge = (type: SentTo) => {
  const config = ANNOUNCEMENT_BADGE_CONFIG[type];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`flex w-fit items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase ${config.className}`}>
      <Icon size={12} strokeWidth={2.5} />
      {config.label}
    </Badge>
  );
};

const mockAnnouncements: Announcement[] = Array.from({ length: 20 }).map((_, index) => ({
  id: (index + 1).toString(),
  announcement:
    'Your dashboard has been updated with new features for faster access and improved performance.',
  sentTo: 'both',
  sentVia: 'sms',
  createdAt: new Date('2024-01-15')
}));

const columns: ColumnDef<Announcement>[] = [
  {
    id: 'sno',
    header: () => <div className="w-5 text-center">S.No</div>,
    cell: ({ row }) => <div className="text-center">{row.index + 1}</div>
  },
  {
    accessorKey: 'announcement',
    header: 'Announcement',
    cell: ({ row }) => {
      const announcement = row.original.announcement;
      return (
        <div className="text-md flex min-w-[200px] flex-col gap-2 font-medium whitespace-normal">
          <span>{announcement}</span>
        </div>
      );
    }
  },
  {
    accessorKey: 'sent to',
    header: 'Sent To & Via',
    cell: ({ row }) => {
      const sentTo = row.original.sentTo;
      const sentVia = row.original.sentVia;
      return (
        <div className="text-md flex min-w-[100px] flex-col gap-2 whitespace-normal">
          {renderAnnouncementBadge(sentTo)}
          <span className="font-medium">
            <span className="text-muted-foreground">via: </span>
            {sentVia}
          </span>
        </div>
      );
    }
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => {
      const date = row.original.createdAt;
      return (
        <div className="text-md flex min-w-[100px] flex-col gap-2 whitespace-normal">
          <span className="font-medium">
            {date.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
      );
    }
  },
  {
    id: 'actions',
    header: '',
    cell: () => (
      <Button variant={'secondary'} className="text-destructive">
        <Trash2 />
      </Button>
    )
  }
];

export default function page() {
  const [message, setMessage] = React.useState('');
  const [audience, setAudience] = React.useState<'all' | 'users' | 'landlords'>('all');
  const [channels, setChannels] = React.useState({
    inApp: true,
    sms: false
  });

  const activeUsers = 450;
  const costPerSms = 0.25;

  const charCount = message.length;
  const smsSegments = Math.ceil(charCount / 160) || 1;
  const totalCost = (activeUsers * smsSegments * costPerSms).toFixed(2);

  React.useEffect(() => {
    if (audience === 'users') {
      setChannels((prev) => ({ ...prev, sms: false }));
    }
  }, [audience]);

  const [isLoading] = React.useState(false);
  const [filter, setFilter] = React.useState<string | null>(null);
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: undefined
  });

  const filteredData = filter
    ? mockAnnouncements.filter((item) => item.sentTo === filter)
    : mockAnnouncements;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex max-w-3xl flex-col gap-2 p-4 sm:gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm tracking-wider uppercase">Type Announcement</CardTitle>

            <Select
              value={audience}
              onValueChange={(v) => setAudience(v as 'all' | 'users' | 'landlords')}>
              <SelectTrigger className="h-8 w-[140px] text-sm font-medium">
                <SelectValue placeholder="Audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="landlords">Landlords</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label className="gap-1">
                Message
                <span className="text-red-500">*</span>
              </Label>

              <Textarea
                className="sm:!text-[15px]"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* In App */}
              <label
                className={`relative flex cursor-pointer items-center rounded-xl border p-4 ${
                  channels.inApp ? 'border-orange-600 bg-orange-50/50' : 'border-border'
                }`}>
                <Checkbox
                  checked={channels.inApp}
                  onCheckedChange={(v) => setChannels({ ...channels, inApp: !!v })}
                />
                <div className="ml-3">
                  <p className="text-sm font-medium">In-App Announcement</p>
                  <p className="text-muted-foreground text-xs">Free • Visible on Home Tab</p>
                </div>
                <Bell className="ml-auto h-5 w-5 text-orange-600" />
              </label>

              {/* SMS */}
              <label
                className={`relative flex items-center rounded-xl border p-4 ${
                  channels.sms ? 'border-orange-600 bg-orange-50/50' : 'border-border'
                } ${audience === 'users' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                <Checkbox
                  disabled={audience === 'users'}
                  checked={channels.sms}
                  onCheckedChange={(v) => setChannels({ ...channels, sms: !!v })}
                />
                <div className="ml-3">
                  <p className="text-sm font-medium">Send via SMS</p>
                  <p className="text-muted-foreground text-xs">Instant delivery to mobile</p>
                </div>
                <Smartphone className="ml-auto h-5 w-5 text-orange-600" />
              </label>
            </div>

            {channels.sms && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertDescription>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <p className="font-medium">Estimated Cost: ₹{totalCost}</p>
                  </div>
                  <p className="text-xs text-amber-700">Based on {activeUsers} users</p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter>
            <div className="ml-auto flex gap-3">
              <Button variant="outline" onClick={() => setMessage('')}>
                Cancel
              </Button>
              <Button>
                <Send className="h-4 w-4" />
                {channels.sms ? 'Send Announcement' : 'Publish Announcement'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
      <div className="box-border flex w-full flex-col gap-2 overflow-hidden p-4 sm:gap-3">
        <h1 className="text-sm font-semibold tracking-widest uppercase">All Promotions</h1>
        <DataTable
          columns={columns}
          data={filteredData}
          searchPlaceholder="Search by name, phone, city or any..."
          isLoading={isLoading}
          filters={{
            value: filter,
            options: [
              { label: 'Landlords', value: 'landlords', icon: Building2 },
              { label: 'Users', value: 'users', icon: Users2 },
              { label: 'Both', value: 'both', icon: Merge },
              { label: 'Show All', value: '', icon: Eye }
            ],

            onChange: (val) => setFilter(val as string)
          }}
          dateRange={range}
          setDateRange={setRange}
        />
      </div>{' '}
    </div>
  );
}
