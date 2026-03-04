import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  showVolumeControl?: boolean;
}

export default function VideoPlayer({
  src,
  poster,
  className = '',
  autoPlay = true,
  loop = true,
  playsInline = true,
  controls = false,
  showVolumeControl = true,
}: VideoPlayerProps) {
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('videoMuted');
    return saved !== null ? saved === 'true' : true;
  });
  const [showControl, setShowControl] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem('videoMuted', String(newMutedState));

    if (videoRef.current) {
      videoRef.current.muted = newMutedState;
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowControl(true)}
      onMouseLeave={() => setShowControl(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={isMuted}
        playsInline={playsInline}
        controls={controls}
        className={className}
      />

      {showVolumeControl && (
        <button
          onClick={toggleMute}
          className={`absolute bottom-4 right-4 p-2.5 bg-black/50 hover:bg-black/70 rounded-full transition-all duration-300 z-10 ${
            showControl ? 'opacity-100' : 'opacity-0'
          }`}
          title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>
      )}
    </div>
  );
}
