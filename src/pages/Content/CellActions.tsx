import React from 'react';
import { createPortal } from 'react-dom';
import { CellDiff } from './CellDiff';
import { Operation, Pending } from './parser';

import { useEffect, useState } from 'react';

export default function CellActions({ diffCells, handleAccept, handleReject }: { diffCells: Map<string, Pending<Operation>>, handleAccept: (cellId: string) => void, handleReject: (cellId: string) => void }) {
    const [cells, setCells] = useState<{ container: Element, id: string }[]>([]);

    useEffect(() => {
        const updateCells = () => {
            const cellElements: { container: Element, id: string }[] = [];

            const cells = document.querySelectorAll('.cell');
            cells.forEach((cell) => {
                const id = cell.getAttribute('id');
                if (!id) return;

                // Find the cell-tag-editor
                const tagEditor = cell.querySelector('.cell-tag-editor');
                if (!tagEditor) return;

                // Find or create container for cell actions
                let actionsContainer = tagEditor.querySelector('.cell-actions-container');
                if (!actionsContainer) {
                    actionsContainer = document.createElement('div');
                    actionsContainer.className = 'cell-actions-container';
                    tagEditor.appendChild(actionsContainer);
                }

                cellElements.push({ container: actionsContainer, id });
            });

            setCells(cellElements);
        };

        updateCells();
        const observer = new MutationObserver(updateCells);
        const notebook = document.querySelector('.notebook-content');

        if (!notebook) {
            console.error('Notebook content not found');
            return;
        }

        observer.observe(notebook, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['id']
        });

        return () => observer.disconnect();
    }, []);

    return (
        <>
            {cells.map((cell) => {
                const operation = diffCells.get(cell.id);
                return operation && createPortal(
                    <CellDiff
                        cellId={cell.id}
                        diff={!!operation?.pending}
                        onAccept={() => handleAccept(cell.id)}
                        onReject={() => handleReject(cell.id)}
                    />,
                    cell.container
                );
            })}
        </>
    );
}
