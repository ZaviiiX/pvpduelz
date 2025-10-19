import React from 'react';

export function VideoPlayer({ video1Ref, video2Ref, aspect, fullHeight }) {
    return (
        <div style={{
            position: 'relative',
            zIndex: 10,
            aspectRatio: aspect,
            width: fullHeight ? "auto" : "min(92vw, 1100px)",
            height: fullHeight ? "calc(100vh - 180px)" : undefined,
            maxWidth: "min(92vw, 1600px)",
            maxHeight: fullHeight ? "calc(100vh - 180px)" : undefined
        }}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <div style={{
                    position: 'absolute',
                    inset: '-2rem',
                    background: 'linear-gradient(to bottom, rgb(31, 41, 55), rgb(17, 24, 39), rgb(0, 0, 0))',
                    border: '8px solid rgb(55, 65, 81)',
                    boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.1), 0 20px 50px rgba(0,0,0,0.8)',
                    borderRadius: '24px'
                }} />

                <div style={{
                    position: 'absolute',
                    inset: '-0.5rem',
                    background: 'black',
                    border: '4px solid rgb(17, 24, 39)',
                    borderRadius: '16px'
                }} />

                <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    border: '4px solid rgb(31, 41, 55)',
                    borderRadius: '12px'
                }}>
                    <video
                        ref={video1Ref}
                        playsInline
                        muted
                        preload="auto"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: 0,
                            zIndex: 1
                        }}
                    />

                    <video
                        ref={video2Ref}
                        playsInline
                        muted
                        preload="auto"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: 0,
                            zIndex: 1
                        }}
                    />

                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 2px, transparent 2px, transparent 4px)',
                        pointerEvents: 'none',
                        zIndex: 10
                    }} />
                </div>
            </div>
        </div>
    );
}
