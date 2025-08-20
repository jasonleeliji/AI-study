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
      const cloudCount = 15;
      
      for (let i = 0; i < cloudCount; i++) {
        const cloud = document.createElement('div');
        cloud.classList.add('spiritual-cloud');
        
        // 随机大小
        const size = Math.random() * 60 + 20;
        cloud.style.width = `${size}px`;
        cloud.style.height = `${size * 0.6}px`;
        
        // 随机位置
        cloud.style.left = `${Math.random() * 100}%`;
        cloud.style.top = `${Math.random() * 100}%`;
        
        // 随机动画时长和延迟
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 5;
        cloud.style.animationDuration = `${duration}s`;
        cloud.style.animationDelay = `${delay}s`;
        
        // 随机透明度
        cloud.style.opacity = `${Math.random() * 0.5 + 0.3}`;
        
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
          z-index: -1;
        }
        
        .spiritual-cloud {
          position: absolute;
          background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.8) 0%, rgba(200, 220, 255, 0.6) 100%);
          border-radius: 50%;
          filter: blur(15px);
          animation: float linear infinite;
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