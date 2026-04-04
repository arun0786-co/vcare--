export function linkMessage(p: { clinicName: string; name: string; ticketNo: number; slot: string | null; url: string }): string {
  const slot = p.slot ? `, slot ${p.slot}` : "";
  return `VCare: ${p.clinicName} booking for ${p.name}, ticket ${p.ticketNo}${slot}. Live queue status: ${p.url}`;
}

export function leaveNowMessage(p: { clinicName: string; expectedTime: string; url: string }): string {
  return `VCare: time to leave for ${p.clinicName}. Your turn is expected around ${p.expectedTime}. Live status: ${p.url}`;
}

export function delayMessage(p: { doctorName: string; expectedTime: string; url: string }): string {
  return `VCare: ${p.doctorName} is running behind. Your turn is now expected around ${p.expectedTime}. Live status: ${p.url}`;
}
