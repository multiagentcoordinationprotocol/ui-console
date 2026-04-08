'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, Input, Textarea, FieldLabel } from '@/components/ui/field';
import { sendRunMessage, sendRunSignal } from '@/lib/api/client';
import { useToast } from '@/components/ui/toast';
import type { RunStateProjection } from '@/lib/types';
import { safeParseJson } from '@/lib/utils/json';

interface SessionInteractionPanelProps {
  runId: string;
  demoMode: boolean;
  state: RunStateProjection;
}

export function SessionInteractionPanel({ runId, demoMode, state }: SessionInteractionPanelProps) {
  const [tab, setTab] = useState<'message' | 'signal'>('message');
  const participants = state.participants.filter((p) => p.status === 'active').map((p) => p.participantId);
  const allParticipants = state.participants.map((p) => p.participantId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session interaction</CardTitle>
        <CardDescription>Send messages or signals into the live runtime session.</CardDescription>
      </CardHeader>
      <CardContent className="stack">
        <div className="section-actions">
          <Button variant={tab === 'message' ? 'primary' : 'ghost'} onClick={() => setTab('message')}>
            <Send size={14} />
            Message
          </Button>
          <Button variant={tab === 'signal' ? 'primary' : 'ghost'} onClick={() => setTab('signal')}>
            <Radio size={14} />
            Signal
          </Button>
        </div>
        {participants.length === 0 && (
          <div className="empty-state compact">
            <h4>No active participants</h4>
            <p>Waiting for participants to join the session.</p>
          </div>
        )}
        {tab === 'message' ? (
          <SendMessageForm runId={runId} demoMode={demoMode} participants={allParticipants} />
        ) : (
          <SendSignalForm runId={runId} demoMode={demoMode} participants={allParticipants} />
        )}
      </CardContent>
    </Card>
  );
}

function SendMessageForm({
  runId,
  demoMode,
  participants
}: {
  runId: string;
  demoMode: boolean;
  participants: string[];
}) {
  const { toast } = useToast();
  const [from, setFrom] = useState(participants[0] ?? '');
  const [to, setTo] = useState('');
  const [messageType, setMessageType] = useState('Signal');
  const [payload, setPayload] = useState('{}');

  const mutation = useMutation({
    mutationFn: () =>
      sendRunMessage(
        runId,
        {
          from,
          to: to.trim() ? to.split(',').map((s) => s.trim()) : undefined,
          messageType,
          payload: safeParseJson(payload)
        },
        demoMode
      ),
    onSuccess: () => {
      setTo('');
      setMessageType('Signal');
      setPayload('{}');
      toast('success', 'Message sent successfully.');
    },
    onError: (error) => {
      toast('error', `Failed to send message.${error instanceof Error ? ` ${error.message}` : ''}`);
    }
  });

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="form-row">
        <div>
          <FieldLabel>From</FieldLabel>
          <Select value={from} onChange={(e) => setFrom(e.target.value)}>
            {participants.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <FieldLabel>To (comma-separated, empty = broadcast)</FieldLabel>
          <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="participant-1, participant-2" />
        </div>
      </div>
      <div>
        <FieldLabel>Message type</FieldLabel>
        <Input value={messageType} onChange={(e) => setMessageType(e.target.value)} />
      </div>
      <div>
        <FieldLabel>Payload (JSON)</FieldLabel>
        <Textarea value={payload} onChange={(e) => setPayload(e.target.value)} rows={3} />
      </div>
      <Button type="submit" disabled={mutation.isPending || !from}>
        <Send size={14} />
        {mutation.isPending ? 'Sending...' : 'Send message'}
      </Button>
      {mutation.isSuccess && <div className="success-text">Message sent successfully.</div>}
      {mutation.isError && (
        <div className="error-text">
          Failed to send message.{mutation.error instanceof Error ? ` ${mutation.error.message}` : ''}
        </div>
      )}
    </form>
  );
}

function SendSignalForm({
  runId,
  demoMode,
  participants
}: {
  runId: string;
  demoMode: boolean;
  participants: string[];
}) {
  const { toast } = useToast();
  const [from, setFrom] = useState(participants[0] ?? '');
  const [to, setTo] = useState(participants.join(', '));
  const [messageType, setMessageType] = useState('Signal');
  const [signalType, setSignalType] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [payload, setPayload] = useState('{}');

  const parsedPayload = safeParseJson(payload);
  const payloadHasContent = Object.keys(parsedPayload).length > 0;
  const signalTypeRequired = payloadHasContent && !signalType.trim();

  const mutation = useMutation({
    mutationFn: () =>
      sendRunSignal(
        runId,
        {
          from,
          to: to
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          messageType,
          payload: parsedPayload,
          signalType: signalType || undefined,
          severity
        },
        demoMode
      ),
    onSuccess: () => {
      setSignalType('');
      setSeverity('medium');
      setMessageType('Signal');
      setPayload('{}');
      toast('success', 'Signal sent successfully.');
    },
    onError: (error) => {
      toast('error', `Failed to send signal.${error instanceof Error ? ` ${error.message}` : ''}`);
    }
  });

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="form-row">
        <div>
          <FieldLabel>From</FieldLabel>
          <Select value={from} onChange={(e) => setFrom(e.target.value)}>
            {participants.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <FieldLabel>To (comma-separated)</FieldLabel>
          <Input value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div>
          <FieldLabel>Signal type</FieldLabel>
          <Input value={signalType} onChange={(e) => setSignalType(e.target.value)} placeholder="e.g. fraud-alert" />
        </div>
        <div>
          <FieldLabel>Severity</FieldLabel>
          <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
        </div>
      </div>
      <div>
        <FieldLabel>Message type</FieldLabel>
        <Input value={messageType} onChange={(e) => setMessageType(e.target.value)} />
      </div>
      <div>
        <FieldLabel>Payload (JSON)</FieldLabel>
        <Textarea value={payload} onChange={(e) => setPayload(e.target.value)} rows={3} />
      </div>
      {signalTypeRequired && <div className="error-text">Signal type is required when payload is provided</div>}
      <Button type="submit" disabled={mutation.isPending || !from || !to.trim() || signalTypeRequired}>
        <Radio size={14} />
        {mutation.isPending ? 'Sending...' : 'Send signal'}
      </Button>
      {mutation.isSuccess && <div className="success-text">Signal sent successfully.</div>}
      {mutation.isError && (
        <div className="error-text">
          Failed to send signal.{mutation.error instanceof Error ? ` ${mutation.error.message}` : ''}
        </div>
      )}
    </form>
  );
}
