'use client';

import { useState } from 'react';
import { Save, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { useLaunchPresetsStore, type LaunchPreset } from '@/lib/stores/launch-presets-store';
import { formatDateTime } from '@/lib/utils/format';

interface PresetManagerProps {
  onLoad: (preset: LaunchPreset) => void;
  currentValues: Omit<LaunchPreset, 'id' | 'createdAt'>;
}

export function PresetManager({ onLoad, currentValues }: PresetManagerProps) {
  const { presets, savePreset, deletePreset } = useLaunchPresetsStore();
  const [presetName, setPresetName] = useState('');

  const handleSave = () => {
    if (!presetName.trim()) return;
    savePreset({ ...currentValues, name: presetName.trim() });
    setPresetName('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Launch presets</CardTitle>
        <CardDescription>Save and load launch configurations for quick reuse.</CardDescription>
      </CardHeader>
      <CardContent className="stack">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="field-label">Preset name</label>
            <Input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="e.g. Fraud check — strict"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          <Button variant="secondary" onClick={handleSave} disabled={!presetName.trim()}>
            <Save size={16} />
            Save current
          </Button>
        </div>

        {presets.length > 0 ? (
          <div className="list">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="list-item"
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
              >
                <div style={{ flex: 1 }}>
                  <div className="list-item-title">{preset.name}</div>
                  <div className="list-item-meta">
                    {preset.packSlug}/{preset.scenarioSlug} · {formatDateTime(preset.createdAt)}
                  </div>
                  <div className="inline-list">
                    <Badge label={preset.mode} tone="info" />
                    <Badge label={preset.templateId} />
                  </div>
                </div>
                <Button variant="secondary" onClick={() => onLoad(preset)}>
                  <Upload size={14} />
                  Load
                </Button>
                <Button variant="ghost" onClick={() => deletePreset(preset.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted small">
            No saved presets yet. Configure the form above and save a preset for quick reuse.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
