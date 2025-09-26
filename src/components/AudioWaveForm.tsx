import React, { useEffect, useRef, useState } from "react";

interface AudioWaveformProps {
  audioUrl: string | null;
  playedColor?: string;
  unplayedColor?: string;
  cursorColor?: string;
  barMaxHeight?: number;
  cursorHeight?: number;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const AudioWaveform: React.FC<AudioWaveformProps> = ({
  audioUrl,
  playedColor = "#2a55ff",
  unplayedColor = "#5b84f5",
  cursorColor = "#000",
  barMaxHeight = 100,
  cursorHeight = 30,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveData, setWaveData] = useState<Float32Array | null>(null);

  // Load and process audio
  useEffect(() => {
    if (!audioUrl) {
      setWaveData(null);
      setDuration(0);
      return;
    }

    const fetchAndProcess = async () => {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      const channelData = audioBuffer.getChannelData(0);
      setWaveData(channelData);
      setDuration(audioBuffer.duration);

      drawWaveform(channelData, 0); // Draw waveform immediately on load
    };

    fetchAndProcess();
  }, [audioUrl]);

  // Draw waveform function
  const drawWaveform = (data: Float32Array, currentTimeSec: number) => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !data) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const step = Math.ceil(data.length / width);
    const amp = barMaxHeight / 2;
    const playedPixels = Math.floor(((audio?.currentTime ?? currentTimeSec) / duration) * width);

    for (let i = 0; i < width; i++) {
      const min = data[i * step] || 0;
      // Ensure a minimum bar height for visibility, e.g., 2px
      const y = Math.max(Math.abs(min) * amp, 2);

      ctx.fillStyle = i < playedPixels ? playedColor : unplayedColor;
      ctx.fillRect(i, (height / 2) - y, 1, y * 2);
    }

    // Draw cursor; vertically centered, height controlled by cursorHeight
    const cursorY = (height - cursorHeight) / 2;
    ctx.fillStyle = cursorColor;
    ctx.fillRect(playedPixels, cursorY, 2, cursorHeight);
  };

  // Animate cursor & played part during playback
  useEffect(() => {
    const animate = () => {
      drawWaveform(waveData!, currentTime);
      animationRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, waveData, currentTime]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div style={{ display: "flex", justifyContent: "start", alignItems: "center", width: "290px", margin:'30px auto 30px 0' }}>
      {/* Play/Pause */}
      {/* <p>{audioUrl}</p> */}
      <button
        onClick={handlePlayPause}
        style={{
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          border: "1px solid #2a55ff",
          borderRadius: "50%",
          background: isPlaying ? "#2a55ff" : "#fff",
          color: isPlaying ? "#fff" : "#2a55ff",
          cursor: "pointer",
          marginRight: 10,
        }}
      >
        {isPlaying ? "⏸" : "▶"}
      </button>

      {/* Waveform */}
      <canvas
        ref={canvasRef}
        width={150}
        height={cursorHeight}
        style={{ flexGrow: 1, marginRight: 10 }}
      />

      {/* Time */}
      <span
        style={{
          whiteSpace: "nowrap",
          fontSize: 10,
          minWidth: 75,
          textAlign: "right",
        }}
      >
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      {/* Hidden audio */}
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        preload="auto"
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default AudioWaveform;
