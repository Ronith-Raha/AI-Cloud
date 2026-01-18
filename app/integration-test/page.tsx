'use client';

import { useRef, useState } from 'react';
import { streamChatTurn } from '@/lib/api/client';
import { useProjectId } from '@/lib/hooks/useProjectId';
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from '@/lib/agents';

export default function IntegrationTestPage() {
  const { projectId, loading, error } = useProjectId();
  const [status, setStatus] = useState<'idle' | 'running' | 'complete' | 'error'>('idle');
  const [output, setOutput] = useState('');
  const [turnInfo, setTurnInfo] = useState<{ turnId: string; nodeId: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const runSmokeTest = async () => {
    if (!projectId || loading) return;
    setStatus('running');
    setOutput('');
    setTurnInfo(null);
    setErrorMessage(null);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await streamChatTurn({
        payload: {
          projectId,
          provider: DEFAULT_PROVIDER as 'openai' | 'anthropic' | 'gemini',
          model: DEFAULT_MODEL,
          userText: 'Hello'
        },
        signal: controller.signal,
        onToken: (data) => {
          setOutput((prev) => prev + data.text);
        },
        onComplete: (data) => {
          setTurnInfo({ turnId: data.turnId, nodeId: data.nodeId });
          setStatus('complete');
        },
        onError: (data) => {
          setErrorMessage(data.message);
          setStatus('error');
        }
      });
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setErrorMessage(err instanceof Error ? err.message : 'Stream failed');
        setStatus('error');
      }
    } finally {
      controllerRef.current = null;
    }
  };

  const cancel = () => {
    controllerRef.current?.abort();
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Integration Smoke Test</h1>
        <p className="text-sm text-white/50">
          Streams a single "Hello" turn via POST + SSE and shows live tokens.
        </p>
      </div>

      <div className="space-y-2 text-sm">
        <p>
          <span className="text-white/40">Project:</span>{' '}
          {loading ? 'Loading…' : projectId ?? 'Unavailable'}
        </p>
        {error && <p className="text-rose-400">{error}</p>}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={runSmokeTest}
          disabled={loading || !projectId || status === 'running'}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white disabled:opacity-40"
        >
          Run Smoke Test
        </button>
        {status === 'running' && (
          <button
            onClick={cancel}
            className="px-4 py-2 rounded-lg border border-white/20 text-white/80 hover:bg-white/5"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="p-4 rounded-xl bg-white/5 border border-white/10 min-h-[140px]">
        <p className="text-xs text-white/40 mb-2">Streamed tokens</p>
        <p className="whitespace-pre-wrap text-sm text-white/90">
          {output || (status === 'idle' ? 'Waiting for stream...' : '')}
        </p>
      </div>

      <div className="text-sm space-y-1">
        <p>
          <span className="text-white/40">Status:</span> {status}
        </p>
        {turnInfo && (
          <>
            <p>
              <span className="text-white/40">Turn ID:</span> {turnInfo.turnId}
            </p>
            <p>
              <span className="text-white/40">Node ID:</span> {turnInfo.nodeId}
            </p>
          </>
        )}
        {errorMessage && <p className="text-rose-400">{errorMessage}</p>}
      </div>
    </div>
  );
}

