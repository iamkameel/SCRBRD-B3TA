'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NUM_CONFETTI = 150;
const COLORS = ["#20c997", "#ffc857", "#212529", "#ffffff", "#f0f3f5"];

const random = (min: number, max: number) => Math.random() * (max - min) + min;

const ConfettiParticle = () => {
    const color = COLORS[Math.floor(random(0, COLORS.length))];
    return (
        <motion.div
            style={{
                position: 'absolute',
                left: `${random(0, 100)}vw`,
                top: `${random(-20, -5)}vh`,
                width: `${random(5, 15)}px`,
                height: `${random(5, 15)}px`,
                backgroundColor: color,
                rotate: random(0, 360),
                zIndex: 100,
            }}
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: '110vh', opacity: 0 }}
            transition={{
                duration: random(1.5, 3),
                ease: "easeIn",
                delay: random(0, 0.5)
            }}
        />
    );
};

export const ConfettiBurst = ({ isActive }: { isActive: boolean }) => {
    return (
        <AnimatePresence>
            {isActive && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        pointerEvents: 'none',
                        zIndex: 9999,
                        overflow: 'hidden',
                    }}
                >
                    {Array.from({ length: NUM_CONFETTI }).map((_, index) => (
                        <ConfettiParticle key={index} />
                    ))}
                </div>
            )}
        </AnimatePresence>
    );
};
