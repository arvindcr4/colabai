(function () {
    document.addEventListener('setMonacoValue', function (event) {
        const notebook = document.querySelector('colab-shaded-scroller');
        const cells = notebook.querySelectorAll('.cell');

        // get cell from id
        const cell = Array.from(cells).find(cell => cell.getAttribute('id') === event.detail.id);

        cell.setText(event.detail.content);

    });

    // document.addEventListener('diffMonacoValue', function (event) {
    //     const notebook = document.querySelector('colab-shaded-scroller');
    //     const cells = notebook.querySelectorAll('.cell');

    //     // get cell from id
    //     const cell = Array.from(cells).find(cell => cell.getAttribute('id') === event.detail.id);

    //     const borderColor = cell.getAttribute('data-operation') === 'insert' ? 'border-green-500' : 'border-gray-500';

    //     //cell.querySelector('.main-content').classList.add(`border-2`)

    //     let content = [];
    //     event.detail.diff.forEach((part, index) => {
    //         content.push(part.value.replace(/\n$/, ''));
    //     });

    //     cell.setText(content.join('\n'));

    //     // Wait for the cell to be rendered before applying the line colors
    //     setTimeout(() => {
    //         const lines = cell.querySelectorAll('.view-line');

    //         if (lines.length !== 0) {
    //             let line = 0;
    //             event.detail.diff.forEach((part, index) => {
    //                 const className = part.added ? 'bg-green-800' : part.removed ? 'bg-red-800' : '';

    //                 for (let i = line; i < line + part.count; i++) {
    //                     if (className.length > 0)
    //                         lines[i].classList.add(className);
    //                 }
    //                 line += part.count;
    //             });
    //         }

    //         // use mutation observer to ensure the line colors are correct
    //         const observer = new MutationObserver((mutations) => {
    //             mutations.forEach((mutation) => {
    //                 if (mutation.type === 'childList') {
    //                     const lines = cell.querySelectorAll('.view-line');

    //                     if (lines.length === 0) return;

    //                     let line = 0;
    //                     event.detail.diff.forEach((part, index) => {
    //                         const className = part.added ? 'bg-green-800' : part.removed ? 'bg-red-800' : '';

    //                         for (let i = line; i < line + part.count; i++) {
    //                             if (className.length > 0)
    //                                 lines[i].classList.add(className);
    //                         }
    //                         line += part.count;
    //                     });
    //                 } // Stop the observer if diff attribute is false
    //                 else if (mutation.type === 'attributes' && mutation.attributeName === 'data-diff' && mutation.target.getAttribute('data-diff') === 'false') {
    //                     observer.disconnect();
    //                 }
    //             });
    //         });

    //         observer.observe(cell, { childList: true, subtree: true, attributes: true });
    //     }, 1000);

    // });

    document.addEventListener('diffMonacoValue', function (event) {
        const notebook = document.querySelector('colab-shaded-scroller');
        const cells = notebook.querySelectorAll('.cell');
        const cell = Array.from(cells).find(cell => cell.getAttribute('id') === event.detail.id);

        let content = [];
        event.detail.diff.forEach((part) => {
            content.push(part.value.replace(/\n$/, ''));
        });

        cell.setText(content.join('\n'));

        cell.setAttribute('data-diff', 'false'); // Used to disconnect any observers

        // // Store diff information on the cell for reuse
        // cell.setAttribute('data-diff-info', JSON.stringify(event.detail.diff));

        function applyHighlighting() {
            const lines = cell.querySelectorAll('.view-line');
            if (lines.length === 0) return;

            let line = 0;
            event.detail.diff.forEach((part) => {
                const className = part.added ? 'bg-green-800' : part.removed ? 'bg-red-800' : '';
                if (!className) {
                    line += part.count;
                    return;
                }

                for (let i = line; i < line + part.count && i < lines.length; i++) {
                    // Only add class if it's not already there
                    if (!lines[i].classList.contains(className)) {
                        lines[i].classList.add(className);
                    }
                }
                line += part.count;
            });
        }

        // Initial application of highlighting with a small delay
        setTimeout(applyHighlighting, 100);

        // Create mutation observer with performance optimizations
        const observer = new MutationObserver((mutations) => {
            // Use requestAnimationFrame to batch DOM updates
            requestAnimationFrame(() => {

                // Check if we need to stop observing
                if (mutations.some(mutation =>
                    mutation.type === 'attributes' &&
                    mutation.attributeName === 'data-diff' &&
                    mutation.target.getAttribute('data-diff') === 'false'
                )) {
                    observer.disconnect();
                    cell.querySelectorAll('.view-line').forEach(line => line.classList.remove('bg-green-800', 'bg-red-800'));
                    return;
                }

                // Only apply highlighting if there are relevant changes
                const hasRelevantChanges = mutations.some(mutation =>
                    mutation.type === 'childList' ||
                    (mutation.type === 'attributes' && mutation.attributeName === 'class')
                );

                if (hasRelevantChanges) {
                    applyHighlighting();
                }
            });
        });

        // Observe with more specific options
        observer.observe(cell, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'data-diff'], // Only observe relevant attributes
            characterData: false // We don't need to observe text changes
        });
    });


    document.addEventListener('getMonacoValue', function (event) {
        const notebook = document.querySelector('colab-shaded-scroller');
        const cells = notebook.querySelectorAll('.cell');

        // get cell from id
        const cell = Array.from(cells).find(cell => cell.getAttribute('id') === event.detail.id);

        const value = cell.getText();

        const customEvent = new CustomEvent('monacoValue', { detail: { value: value } });

        document.dispatchEvent(customEvent);
    });

    document.addEventListener('getContent', function (event) {
        const cells = document.querySelectorAll('.cell');
        const content = [];

        cells.forEach((cell, index) => {
            const type = cell.classList.contains('code') ? 'code' : 'markdown';
            const value = cell.getText();
            const id = cell.getAttribute('id');

            content.push({ id, type, content: value });
        });

        const customEvent = new CustomEvent('contentValue', { detail: { content: content } });

        document.dispatchEvent(customEvent);
    });

    document.addEventListener('deleteCell', function (event) {
        const notebook = document.querySelector('colab-shaded-scroller');
        const cells = notebook.querySelectorAll('.cell');

        // get cell from id
        const cell = Array.from(cells).find(cell => cell.getAttribute('id') === event.detail.id);

        cell.focusCell_();

        setTimeout(() => {
            document.querySelector('colab-cell-toolbar').shadowRoot.getElementById('button-delete-cell-or-selection').click();
        }, 400);
    });
})();