import React from 'react';

export function VideoPlayer({ video1Ref, video2Ref, aspect, fullHeight }) {
    return (
        <div
            style={{
                position: 'relative',
                zIndex: 10,
                aspectRatio: aspect,
                width: fullHeight ? 'auto' : 'min(92vw, 1100px)',
                height: fullHeight ? 'calc(100vh - 180px)' : undefined,
                maxWidth: 'min(92vw, 1600px)',
                maxHeight: fullHeight ? 'calc(100vh - 180px)' : undefined
            }}
            className="glass-dark"
        >
            {/* Outer carved stone */}
            <div
                style={{
                    position: 'absolute',
                    inset: '-2.2rem',
                    borderRadius: '0',
                    border: '10px solid #8b6914',
                    boxShadow:
                        'inset 0 4px 0 rgba(255,255,255,0.15), 0 30px 70px rgba(0,0,0,0.9)',
                    background:
                        'linear-gradient(135deg, #2b1a11 0%, #140b07 40%, #0b0704 100%)'
                }}
                className="animate-gold-shine"
            />

            {/* Inner bronze bezel with rivets */}
            <div
                style={{
                    position: 'absolute',
                    inset: '-0.6rem',
                    borderRadius: '0',
                    border: '5px solid #8b6914',
                    background: '#000',
                    boxShadow: 'inset 0 2px 12px rgba(212,175,55,0.25)'
                }}
            >
                {/* Rivets */}
                {['8% 8%','92% 8%','8% 92%','92% 92%'].map((pos, i) => (
                    <span
                        key={i}
                        style={{
                            position: 'absolute',
                            left: pos.split(' ')[0],
                            top: pos.split(' ')[1],
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background:
                                'radial-gradient(circle at 30% 30%, #ffd982, #b0831d 60%, #5f3e09 100%)',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.8)'
                        }}
                    />
                ))}
            </div>

            {/* Actual video viewport */}
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    border: '4px solid rgb(31, 41, 55)'
                }}
            >
                <video
                    ref={video1Ref}
                    playsInline
                    muted
                    preload="auto"
                    style={{
                        position: 'absolute',
                        inset: 0,
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
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0,
                        zIndex: 1
                    }}
                />

                {/* Subtle sand scanline */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                            'repeating-linear-gradient(0deg, rgba(0,0,0,0.18), rgba(0,0,0,0.18) 2px, transparent 2px, transparent 4px)',
                        pointerEvents: 'none',
                        zIndex: 10
                    }}
                />
            </div>
        </div>
    );
}
