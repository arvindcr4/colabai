import React, { useRef, useState, useEffect } from "react";

export default function ColResize({ setWidth, minWidth, maxWidth }: {
    setWidth: React.Dispatch<React.SetStateAction<number>>,
    minWidth: number,
    maxWidth: number
}) {
    const isResized = useRef(false);
    const overlay = useRef<HTMLDivElement | null>(null);

    useEffect(() => {

        overlay.current = document.createElement('div');
        overlay.current.style.position = 'fixed';
        overlay.current.style.top = '0';
        overlay.current.style.left = '0';
        overlay.current.style.width = '100%';
        overlay.current.style.height = '100%';
        overlay.current.style.cursor = 'col-resize';
        overlay.current.style.zIndex = '9999';
        overlay.current.style.backgroundColor = 'transparent';
        overlay.current.style.display = 'none';

        document.body.appendChild(overlay.current);

        overlay.current.addEventListener("mousemove", (e) => {
            if (!isResized.current) {
                return;
            }

            setWidth((previousWidth) => {
                const newWidth = window.innerWidth - e.pageX;

                const isWidthInRange = newWidth >= minWidth && newWidth <= maxWidth;

                return isWidthInRange ? newWidth : previousWidth;
            });

            e.preventDefault();
            pauseEvent(e);
        });

        overlay.current.addEventListener("mouseup", () => {
            isResized.current = false;
            if (overlay.current)
                overlay.current.style.display = 'none';
        });

        function pauseEvent(e: Event) {
            if (e.stopPropagation) e.stopPropagation();
            if (e.preventDefault) e.preventDefault();
            e.cancelBubble = true;
            e.returnValue = false;
            return false;
        }

    }, [])

    return (
        <div
            className="w-2 cursor-col-resize"
            onMouseDown={() => {
                isResized.current = true;
                if (overlay.current) {
                    overlay.current.style.display = 'block';
                }
            }}
        />
    )
}