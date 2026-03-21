export function linkMessage(p: { clinicName: string; name: string; ticketNo: number; slot: string | null; url: string }): string {
  const slot = p.slot ? `, slot ${p.slot}` : "";
  return `VCare: ${p.clinicName} booking for ${p.name}, ticket ${p.ticketNo}${slot}. Live queue status: ${p.url}`;
}
