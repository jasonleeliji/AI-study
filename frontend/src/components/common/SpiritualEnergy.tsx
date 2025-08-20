import React, { useEffect, useRef } from 'react';

interface SpiritualEnergyProps {
  className?: string;
}

const SpiritualEnergy: React.FC<SpiritualEnergyProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 创建祥云
    const createClouds = () => {
      const cloudCount = 20;
      
      for (let i = 0; i < cloudCount; i++) {
        const cloud = document.createElement('div');
        cloud.classList.add('spiritual-cloud');
        
        // 随机大小，更适合横屏显示
        const width = Math.random() * 120 + 60;
        const height = Math.random() * 70 + 40;
        cloud.style.width = `${width}px`;
        cloud.style.height = `${height}px`;
        
        // 随机位置，更适合横屏布局
        cloud.style.left = `${Math.random() * 100}%`;
        cloud.style.top = `${Math.random() * 100}%`;
        
        // 随机动画时长和延迟
        const duration = Math.random() * 30 + 20;
        const delay = Math.random() * 10;
        cloud.style.animationDuration = `${duration}s`;
        cloud.style.animationDelay = `${delay}s`;
        
        // 随机透明度
        cloud.style.opacity = `${Math.random() * 0.4 + 0.2}`;
        
        container.appendChild(cloud);
      }
    };

    createClouds();

    // 清理函数
    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  return (
    <div ref={containerRef} className={`spiritual-energy-container ${className}`}>
      <style>{`
        .spiritual-energy-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
        }
        
        .spiritual-cloud {
          position: absolute;
          background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.9) 0%, rgba(173, 216, 230, 0.6) 70%, rgba(135, 206, 250, 0.3) 100%);
          border-radius: 50%;
          filter: blur(20px);
          animation: float linear infinite;
          z-index: 0;
        }
        
        @keyframes float {
          0% {
            transform: translateX(-100px) translateY(0) scale(1);
          }
          25% {
            transform: translateX(0) translateY(-20px) scale(1.1);
          }
          50% {
            transform: translateX(100px) translateY(0) scale(1);
          }
          75% {
            transform: translateX(0) translateY(20px) scale(0.9);
          }
          100% {
            transform: translateX(-100px) translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default SpiritualEnergy;