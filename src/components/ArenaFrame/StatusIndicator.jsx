import React from 'react';
import { cls } from './utils';

export function StatusIndicator({ syncMode, devMode, isConnected, userCount }) {
    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <div className="status-indicator">
                <div className="flex items-center gap-4">
                    {syncMode && (
                        <>
                            <div className={cls("status-dot", isConnected ? "bg-green-500 ml-2" : "bg-red-500")} />
                            <span className={cls("text-sm font-semibold", isConnected ? "text-green-400" : "text-red-400")}>
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </span>
                            {isConnected && userCount > 0 && (
                                <span className="text-sm pl-2 text-gray-400 mr-2">{userCount} viewers</span>
                            )}
                        </>
                    )}

                    {devMode && (
                        <>
                            <span className="text-xs text-yellow-400 font-bold">🛠 DEV MODE</span>
                            <div className="w-px h-6 bg-gray-600" />
                        </>
                    )}


                </div>
            </div>
        </div>
    );
}
