import { PageHeader } from '@/components/layout/page-header';
import { RequestForm } from '@/components/requests/request-form';
// Submits then routes to /u/requests (handled inside RequestForm).

export default function NewRequestPage() {
  return (
    <>
      <PageHeader title="New delivery request" description="Tell us what to deliver and where." />
      <RequestForm />
    </>
  );
}
