(function () {
    document.addEventListener('setMonacoValue', function (event) {
        const notebook = document.querySelector('colab-shaded-scroller');
        const cells = notebook.querySelectorAll('.cell');

        // get cell from id
        const cell = Array.from(cells).find(cell => cell.getAttribute('id') === event.detail.id);

        cell.setText(event.detail.content);
    });

    document.addEventListener('getContent', function (event) {
        const cells = document.querySelectorAll('.cell');
        const content = [];

        cells.forEach((cell, index) => {
            const type = cell.classList.contains('code') ? 'code' : 'text';
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

        cell.remove();
    });
})();