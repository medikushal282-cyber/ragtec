import React, { useEffect, useRef } from 'react';

export const MagneticCursor: React.FC = () => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const cursorBracketsRef = useRef<HTMLDivElement>(null);
    const cursorDotRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let cursorX = mouseX;
        let cursorY = mouseY;
        let rotation = 0;
        let currentWidth = 24;
        let currentHeight = 24;
        let animationFrameId: number;

        const POS_SIZE_LERP = 0.078;
        const ROT_LERP = 0.039;
        const FREE_SIZE = 24;
        const SPIN_RATE = 2.34;
        const SWAY_AMOUNT = 0.1;

        const onMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        const getClosestButton = () => {
            let active: { el: Element, rect: DOMRect } | null = null;
            // Target any interactive element or element explicitly marked
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
                
                targetWidth = rect.width + 12; // Slight padding to frame the button
                targetHeight = rect.height + 12;
                
                // Sway/displacement logic
                const offX = (mouseX - btnCenterX) * SWAY_AMOUNT;
                const offY = (mouseY - btnCenterY) * SWAY_AMOUNT;
                
                targetX = btnCenterX + offX;
                targetY = btnCenterY + offY;
                
                // Graceful rotation snap
                targetRotation = getNearestAxis(rotation);
            } else if (cursorDotRef.current) {
                cursorDotRef.current.classList.remove('hovering-dot');
            }

            // Lerp values
            cursorX += (targetX - cursorX) * POS_SIZE_LERP;
            cursorY += (targetY - cursorY) * POS_SIZE_LERP;
            
            currentWidth += (targetWidth - currentWidth) * POS_SIZE_LERP;
            currentHeight += (targetHeight - currentHeight) * POS_SIZE_LERP;
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
            <div className="cursor-wrapper hidden md:block" ref={cursorRef} id="cursor" style={{ width: '24px', height: '24px' }}>
                <div className="cursor-brackets" ref={cursorBracketsRef} id="cursor-brackets">
                    <div className="bracket bracket-tl"></div>
                    <div className="bracket bracket-tr"></div>
                    <div className="bracket bracket-bl"></div>
                    <div className="bracket bracket-br"></div>
                </div>
            </div>
            <div className="center-dot hidden md:block" ref={cursorDotRef} id="cursor-dot"></div>
        </>
    );
};
