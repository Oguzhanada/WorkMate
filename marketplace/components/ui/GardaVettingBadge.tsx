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
      return <Badge tone="pending">Garda Vetting Expired</Badge>;
    }
    return <Badge tone="completed">Garda Vetted</Badge>;
  }

  if (status === 'pending') {
    return <Badge tone="pending">Garda Vetting Pending</Badge>;
  }

  if (status === 'expired') {
    return <Badge tone="pending">Garda Vetting Expired</Badge>;
  }

  return null;
}
