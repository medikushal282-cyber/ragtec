import React, { useEffect, useRef, useState } from 'react';
import { Sliders } from 'lucide-react';

export const MagneticCursor: React.FC = () => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const cursorBracketsRef = useRef<HTMLDivElement>(null);
    const cursorDotRef = useRef<HTMLDivElement>(null);

    // Locked Speed State set to 0.195
    const [speed, setSpeed] = useState<number>(() => {
        const saved = localStorage.getItem('magnetic_snap_speed');
        return saved ? parseFloat(saved) : 0.195;
    });

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const speedRef = useRef<number>(speed);

    useEffect(() => {
        speedRef.current = speed;
        localStorage.setItem('magnetic_snap_speed', speed.toString());
    }, [speed]);

    useEffect(() => {
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let cursorX = mouseX;
        let cursorY = mouseY;
        let rotation = 0;
        let currentWidth = 24;
        let currentHeight = 24;
        let animationFrameId: number;

        const ROT_LERP = 0.1404;
        const FREE_SIZE = 24;
        const SPIN_RATE = 2.34;
        const SWAY_AMOUNT = 0.1;

        const onMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        const getClosestButton = () => {
            let active: { el: Element, rect: DOMRect } | null = null;
            const buttons = document.querySelectorAll('.magnetic-target, a, button');

            buttons.forEach(btn => {
                const rect = btn.getBoundingClientRect();
                if (mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom) {
                    active = { el: btn, rect };
                }
            });

            return active;
        };

        const getNearestAxis = (currentRotation: number) => {
            return Math.round(currentRotation / 360) * 360;
        };

        const loop = () => {
            const activeTarget = getClosestButton();
            const currentSpeed = speedRef.current;

            let targetX = mouseX;
            let targetY = mouseY;
            let targetWidth = FREE_SIZE;
            let targetHeight = FREE_SIZE;
            let targetRotation = rotation + SPIN_RATE;

            if (activeTarget && cursorDotRef.current) {
                cursorDotRef.current.classList.add('hovering-dot');
                
                const rect = (activeTarget as any).rect;
                const btnCenterX = rect.left + rect.width / 2;
                const btnCenterY = rect.top + rect.height / 2;
                
                targetWidth = rect.width + 12;
                targetHeight = rect.height + 12;
                
                // Sway/displacement logic
                const offX = (mouseX - btnCenterX) * SWAY_AMOUNT;
                const offY = (mouseY - btnCenterY) * SWAY_AMOUNT;
                
                targetX = btnCenterX + offX;
                targetY = btnCenterY + offY;
                
                // Graceful rotation snap target
                targetRotation = getNearestAxis(rotation);
            } else if (cursorDotRef.current) {
                cursorDotRef.current.classList.remove('hovering-dot');
            }

            // Clean Lerp Calculations (Locked at 0.195)
            cursorX += (targetX - cursorX) * currentSpeed;
            cursorY += (targetY - cursorY) * currentSpeed;
            currentWidth += (targetWidth - currentWidth) * currentSpeed;
            currentHeight += (targetHeight - currentHeight) * currentSpeed;
            rotation += (targetRotation - rotation) * (activeTarget ? ROT_LERP : 1);

            // Apply transforms
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate(${cursorX - currentWidth/2}px, ${cursorY - currentHeight/2}px)`;
                cursorRef.current.style.width = `${currentWidth}px`;
                cursorRef.current.style.height = `${currentHeight}px`;
            }
            
            if (cursorBracketsRef.current) {
                cursorBracketsRef.current.style.transform = `rotate(${rotation}deg)`;
            }
            
            if (cursorDotRef.current) {
                cursorDotRef.current.style.left = `${mouseX}px`;
                cursorDotRef.current.style.top = `${mouseY}px`;
            }

            animationFrameId = requestAnimationFrame(loop);
        };

        window.addEventListener('mousemove', onMouseMove);
        
        // Init loop
        animationFrameId = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <>
            {/* Custom Cursor Overlay */}
            <div className="cursor-wrapper hidden md:block" ref={cursorRef} id="cursor" style={{ width: '24px', height: '24px' }}>
                <div className="cursor-brackets" ref={cursorBracketsRef} id="cursor-brackets">
                    <div className="bracket bracket-tl"></div>
                    <div className="bracket bracket-tr"></div>
                    <div className="bracket bracket-bl"></div>
                    <div className="bracket bracket-br"></div>
                </div>
            </div>
            <div className="center-dot hidden md:block" ref={cursorDotRef} id="cursor-dot"></div>

            {/* Floating Live Magnetic Snap Speed Control Widget */}
            <div className="fixed bottom-4 right-4 z-[9999] font-mono text-xs">
                {isOpen ? (
                    <div className="bg-black/90 backdrop-blur-xl border border-white/20 p-3.5 rounded-xl shadow-2xl space-y-2.5 w-60 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <div className="flex items-center gap-1.5 text-cyber-cyan font-bold uppercase text-[10px]">
                                <Sliders className="w-3.5 h-3.5" />
                                <span>Snap Speed Tuner</span>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white text-[10px] font-bold px-1"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-gray-300">
                                <span>Stiffness Speed:</span>
                                <span className="font-bold text-cyber-cyan">{speed.toFixed(3)}</span>
                            </div>
                            <input
                                type="range"
                                min="0.005"
                                max="0.300"
                                step="0.005"
                                value={speed}
                                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-cyber-cyan"
                            />
                            <div className="flex justify-between text-[8px] text-gray-500 font-mono pt-1">
                                <span>0.005 (Slow/Fluid)</span>
                                <span>0.300 (Instant Snap)</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="bg-black/80 hover:bg-black/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 text-gray-300 hover:text-cyber-cyan transition-colors flex items-center gap-1.5 shadow-xl font-mono text-[11px]"
                        title="Adjust Magnetic Cursor Snap Speed"
                    >
                        <Sliders className="w-3.5 h-3.5 text-cyber-cyan" />
                        <span>Cursor Speed (0.195)</span>
                    </button>
                )}
            </div>
        </>
    );
};
