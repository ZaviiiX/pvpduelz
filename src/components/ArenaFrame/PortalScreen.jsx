import React from 'react';

export function PortalScreen({
                                 portalPhase,
                                 showCTA,
                                 ctaPosition,
                                 isHovering,
                                 setIsHovering,
                                 portalIntroRef,
                                 portalEntranceRef,
                                 canvasRef,
                                 ctaRef,
                                 portalVideos,
                                 handleIntroEnded,
                                 handleCTAClick,
                                 handlePortalEnded,
                             }) {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {/* INTRO VIDEO */}
                <video
                    ref={portalIntroRef}
                    playsInline
                    muted
                    preload="auto"
                    onEnded={handleIntroEnded}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: portalPhase === 'intro' ? 1 : 0,
                        transition: 'opacity 0.5s ease',
                        zIndex: 2
                    }}
                >
                    <source src={portalVideos.intro} type="video/mp4" />
                </video>

                {/* ENDFRAME IMAGE */}
                {portalVideos.endframe && (
                    <img
                        src={portalVideos.endframe}
                        alt=""
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: portalPhase === 'endframe' ? 1 : 0,
                            transition: 'opacity 0.3s ease',
                            pointerEvents: 'none',
                            zIndex: 1
                        }}
                    />
                )}

                {/* HOVER ENDFRAME */}
                {portalVideos.endframeHover && (
                    <img
                        src={portalVideos.endframeHover}
                        alt=""
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: isHovering ? 1 : 0,
                            transition: 'opacity 0.2s ease',
                            pointerEvents: 'none',
                            zIndex: 3
                        }}
                    />
                )}

                {/* PORTAL VIDEO */}
                <video
                    ref={portalEntranceRef}
                    playsInline
                    muted
                    preload="auto"
                    onEnded={handlePortalEnded}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: portalPhase === 'transition' ? 1 : 0,
                        transition: 'opacity 0.6s ease',
                        pointerEvents: 'none',
                        zIndex: 4
                    }}
                >
                    <source src={portalVideos.portalEntrance} type="video/mp4" />
                </video>

                {/* CTA BUTTON */}
                {showCTA && portalPhase === 'endframe' && (
                    <a
                    ref={ctaRef}
                    href="#"
                    onClick={handleCTAClick}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    style={{
                    position: 'absolute',
                    left: ctaPosition.x,
                    top: ctaPosition.y,
                    transform: 'translate(-50%, -50%)',
                    width: ctaPosition.size + 'px',
                    height: ctaPosition.size + 'px',
                    minWidth: ctaPosition.size + 'px',
                    borderRadius: '50%',
                    background: 'transparent',
                    border: 'none',
                    opacity: 0,
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    zIndex: 13,
                }}
                    />
                    )}
            </div>
        </div>
    );
}
