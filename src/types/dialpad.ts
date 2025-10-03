export interface DialpadCallLog {
  id: string;
  call_id: string;
  direction: 'inbound' | 'outbound';
  from_number: string;
  to_number: string;
  start_time: string;
  end_time: string;
  duration: number;
  status: 'answered' | 'missed' | 'voicemail' | 'busy' | 'failed';
  recording_url?: string;
  voicemail_url?: string;
  user_id?: string;
  user_name?: string;
  department_id?: string;
  department_name?: string;
  tags?: string[];
  notes?: string;
}

export interface DialpadWebhookEvent {
  event_type: string;
  timestamp: string;
  data: DialpadCallLog;
}

export interface DialpadWebhookPayload {
  events: DialpadWebhookEvent[];
}
