"use client";

import { useEffect, useRef, useState } from "react";
import { Music, Pause, Play } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PRESETS = {
  focus: { label: "Focus", baseFreq: 220, detune: 6, filterFreq: 900 },
  calm: { label: "Calm", baseFreq: 174, detune: 4, filterFreq: 600 },
  deep: { label: "Deep work", baseFreq: 110, detune: 8, filterFreq: 450 },
} as const;

type PresetKey = keyof typeof PRESETS;

interface AudioGraph {
  ctx: AudioContext;
  oscillators: OscillatorNode[];
  masterGain: GainNode;
}

export default function FocusMusicPage() {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [preset, setPreset] = useState<PresetKey>("focus");
  const graphRef = useRef<AudioGraph | null>(null);

  const stop = () => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.oscillators.forEach((o) => {
      try {
        o.stop();
      } catch {
        // already stopped
      }
    });
    graph.ctx.close();
    graphRef.current = null;
    setPlaying(false);
  };

  const start = (presetKey: PresetKey = preset) => {
    if (graphRef.current) stop();

    const ctx = new AudioContext();
    const { baseFreq, detune, filterFreq } = PRESETS[presetKey];

    const masterGain = ctx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.7;
    filter.connect(masterGain);

    const oscillators: OscillatorNode[] = [];
    for (const multiplier of [1, 1.5, 2]) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = baseFreq * multiplier;
      osc.detune.value = (Math.random() - 0.5) * detune * 2;
      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.16;
      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start();
      oscillators.push(osc);
    }

    // Slow LFO on the filter cutoff for gentle movement rather than a static drone.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    oscillators.push(lfo);

    graphRef.current = { ctx, oscillators, masterGain };
    setPlaying(true);
  };

  useEffect(() => {
    if (graphRef.current) graphRef.current.masterGain.gain.value = volume;
  }, [volume]);

  useEffect(() => () => stop(), []);

  return (
    <>
      <PageHeader title="Focus Music" description="Generated ambient tones for deep-work sessions — synthesized locally, no streaming" />
      <PageTransition>
        <div className="p-6 md:p-8">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="size-4" /> Ambient generator
              </CardTitle>
              <CardDescription>Layered sine tones + slow filter sweep, synthesized in your browser</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-center py-4">
                <Button
                  size="icon"
                  className={cn("size-16 rounded-full", playing && "animate-pulse")}
                  onClick={() => (playing ? stop() : start())}
                >
                  {playing ? <Pause className="size-6" /> : <Play className="size-6" />}
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="preset">Preset</Label>
                <Select
                  id="preset"
                  value={preset}
                  onChange={(e) => {
                    const next = e.target.value as PresetKey;
                    setPreset(next);
                    if (playing) start(next);
                  }}
                >
                  {Object.entries(PRESETS).map(([key, p]) => (
                    <option key={key} value={key}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="volume">Volume</Label>
                <input
                  id="volume"
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    </>
  );
}
