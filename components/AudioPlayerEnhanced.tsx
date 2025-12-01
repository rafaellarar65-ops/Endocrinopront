import { useEffect, useRef, useState } from "react";
import { Download, FastForward, Pause, Play } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  onDownload?: () => void;
}

export function AudioPlayerEnhanced({ src, onDownload }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setProgress(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onEnd = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const changeSpeed = () => {
    const nextSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = nextSpeed;
    }
    setSpeed(nextSpeed);
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setProgress(value);
  };

  const formatTime = (time: number) => {
    if (!Number.isFinite(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="bg-white border rounded-lg p-3 shadow-sm flex flex-col gap-3">
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={togglePlay}
          className="h-10 w-10 rounded-full border flex items-center justify-center bg-gray-50 hover:bg-gray-100"
          aria-label={isPlaying ? "Pausar" : "Reproduzir"}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </button>

        <div className="flex-1 space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={1}
            value={progress}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-gray-500 font-medium font-mono">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={changeSpeed}
            className="h-8 px-3 rounded-md border text-xs font-semibold bg-gray-50 hover:bg-gray-100"
            aria-label="Alternar velocidade"
          >
            {speed}x
          </button>
          <button
            type="button"
            onClick={() => handleSeek(Math.min(progress + 15, duration))}
            className="h-8 w-8 rounded-md border flex items-center justify-center bg-gray-50 hover:bg-gray-100"
            aria-label="Avançar 15 segundos"
          >
            <FastForward className="h-4 w-4" />
          </button>
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="h-8 w-8 rounded-md border flex items-center justify-center bg-gray-50 hover:bg-gray-100"
              aria-label="Download do áudio"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
