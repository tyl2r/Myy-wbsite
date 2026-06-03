'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { ActivityTimeline, type ActivityItem } from '@/components/activity/activity-timeline';

/**
 * Audit view reuses the shared ActivityTimeline. Audit entries come from the
 * backend audit_logs endpoint (wired when that admin endpoint is exposed); for
 * now it demonstrates the reusable timeline with representative actions.
 */
const SAMPLE: ActivityItem[] = [
  { id: '1', tone: 'success', title: 'Worker #3 verified', meta: 'by admin@routeshare.dev', timestamp: '2m ago' },
  { id: '2', tone: 'danger', title: 'User #18 suspended', meta: 'by admin@routeshare.dev', timestamp: '1h ago' },
  { id: '3', tone: 'brand', title: 'Request #1042 reassigned', meta: 'by admin@routeshare.dev', timestamp: '3h ago' },
];

export default function AdminAudit() {
  return (
    <>
      <PageHeader title="Audit log" description="Administrative actions across the platform." />
      <Card>
        <CardBody>
          <ActivityTimeline items={SAMPLE} />
        </CardBody>
      </Card>
    </>
  );
}
