
import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from 'react';

interface CameraProps {
  onCameraError: (error: string) => void;
  onCameraReady?: (ready: boolean) => void;
}

export interface CameraHandle {
  captureFrame: () => string | null;
}

const Camera = forwardRef<CameraHandle, CameraProps>(({ onCameraError, onCameraReady }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
    if (onCameraReady) onCameraReady(false);
  }, [onCameraReady]);

  const setupCamera = useCallback(async () => {
    setIsInitializing(true);

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        } 
      });

      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        setIsCameraReady(true);
        if (onCameraReady) onCameraReady(true);
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      onCameraError("无法访问摄像头，请检查权限设置");
      setIsCameraReady(false);
      if (onCameraReady) onCameraReady(false);
    } finally {
      setIsInitializing(false);
    }
  }, [onCameraError, onCameraReady]);

  useEffect(() => {
    setupCamera();

    return () => {
      stopCamera();
    };
  }, [setupCamera, stopCamera]);

  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      if (videoRef.current && canvasRef.current && isCameraReady) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        canvas.width = 480;
        canvas.height = 360;
        
        const context = canvas.getContext('2d');
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', 0.8);
        }
      }
      return null;
    }
  }));

  return (
    <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden shadow-inner">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-500 ${isCameraReady ? 'opacity-100' : 'opacity-0'}`}
        onCanPlay={() => setIsCameraReady(true)}
        style={{ transform: 'scaleX(-1)' }} // 水平翻转视频以获得自然的自拍效果
      />
      {!isCameraReady && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <p>{isInitializing ? "正在启动摄像头..." : "摄像头启动失败"}</p>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
});

export default React.memo(Camera);
