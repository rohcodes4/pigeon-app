import React, { useEffect, useRef } from "react";

interface LiveAudioWaveformProps {
  barMaxHeight?: number;
  barColor?: string;
  cursorColor?: string;
}

const LiveAudioWaveform: React.FC<LiveAudioWaveformProps> = ({
  barMaxHeight = 16, // keep a little less than 20
  barColor = "#2a55ff",
  cursorColor = "#000",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      console.error("getUserMedia not supported");
      return;
    }

    const setupAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        source.connect(analyser);

        animate();
      } catch (error) {
        console.error("Error accessing microphone", error);
      }
    };

    setupAudio();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      analyserRef.current?.disconnect();
      audioCtxRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    if (!analyser || !dataArray) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    analyser.getByteTimeDomainData(dataArray);

    const centerY = height / 2;
    const amp = barMaxHeight / 2;
    const barWidth = 1;

    for (let i = 0; i < width; i++) {
      const idx = Math.floor((i / width) * dataArray.length);
      const value = dataArray[idx] / 128 - 1;
      const barHeight = Math.max(Math.abs(value) * amp, 2);

      ctx.fillStyle = barColor;
      ctx.fillRect(i, centerY - barHeight, barWidth, barHeight * 2);
    }

    // cursor (full height of canvas)
    // ctx.fillStyle = cursorColor;
    // ctx.fillRect(width / 2, 0, 2, height);
  };

  const animate = () => {
    drawWaveform();
    animationRef.current = requestAnimationFrame(animate);
  };

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={20} // fixed max height
      style={{
        flexGrow: 1,
        marginLeft: 10,
        userSelect: "none",
        maxHeight: 20,
      }}
      aria-label="Live audio waveform visualization"
    />
  );
};

export default LiveAudioWaveform;
