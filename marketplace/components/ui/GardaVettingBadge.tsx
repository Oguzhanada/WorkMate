import Badge from './Badge';

type GardaVettingStatus = 'not_required' | 'pending' | 'approved' | 'rejected' | 'expired' | null | undefined;

type Props = {
  status: GardaVettingStatus;
  expiresAt?: string | null;
};

export default function GardaVettingBadge({ status, expiresAt }: Props) {
  if (!status || status === 'not_required') return null;

  if (status === 'approved') {
    const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
    if (isExpired) {
      return (
        <Badge tone="pending" title="This provider's Garda Vetting disclosure has passed its re-vetting date. Re-vetting is in progress or required.">
          Garda Vetting Expired
        </Badge>
      );
    }
    return (
      <Badge tone="completed" title="Vetted through the National Vetting Bureau (NVB). WorkMate submits and verifies all Garda Vetting disclosures.">
        Garda Vetted
      </Badge>
    );
  }

  if (status === 'pending') {
    return (
      <Badge tone="pending" title="Garda Vetting application submitted to the National Vetting Bureau. Processing typically takes 2-4 weeks.">
        Garda Vetting Pending
      </Badge>
    );
  }

  if (status === 'expired') {
    return (
      <Badge tone="pending" title="This provider's Garda Vetting disclosure has passed its re-vetting date.">
        Garda Vetting Expired
      </Badge>
    );
  }

  return null;
}
