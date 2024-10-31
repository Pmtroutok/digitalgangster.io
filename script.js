document.addEventListener('DOMContentLoaded', function() {
    const apiTokenInput = document.getElementById('api-token');
    const conceptButton = document.getElementById('conceptButton');
    const contentButton = document.getElementById('contentButton');
    const chaptersButton = document.getElementById('chaptersButton');
    const saveConceptButton = document.getElementById('saveConceptButton');
    const saveContentsButton = document.getElementById('saveContentsButton');
    const exportButton = document.getElementById('exportButton');

    const conceptInput = document.getElementById('concept');
    const contentsInput = document.getElementById('contents');
    const chaptersDiv = document.getElementById('chapters');
    const autoGenCheckbox = document.getElementById('auto-gen');
    const introductionInput = document.getElementById('introduction');
    const generateIntroductionButton = document.getElementById('generateIntroductionButton');
    const glossaryInput = document.getElementById('glossary');
    const generateGlossaryButton = document.getElementById('generateGlossaryButton');
    const generateDescriptionAmazonButton = document.getElementById('generateDiscriptionAmazon');
    const generate7KeywordsButton = document.getElementById('generate7keywords');
    const generateAboutAuthorButton = document.getElementById('generateAboutAuthor');
    const descriptionInput = document.getElementById('description');
    const gen7keywordsInput = document.getElementById('gen7keywords');
    const aboutAuthorInput = document.getElementById('aboutAuthor');

    let tableOfContents = [];
    let currentLine = 0;

    function getApiToken() {
        return apiTokenInput.value;
    }

    async function generateContent(version, role, prompt) {
        const apiToken = getApiToken();
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: version,
                messages: [{
                    role: 'system',
                    content: role
                }, {
                    role: 'user',
                    content: prompt
                }]
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    }

    function disableInputsAndButtons(inputs, buttons) {
        inputs.forEach(input => input.disabled = true);
        buttons.forEach(button => button.disabled = true);
    }

    function getInputValues() {
        const gptVersion = document.getElementById('gpt-version').value;
        const gptRole = document.getElementById('gpt-role').value;
        const bookLength = document.getElementById('book-length').value;
        const genre = document.getElementById('genre').value;
        const keywords = document.getElementById('keywords').value.split(',');
        const extraInstructions = document.getElementById('extra-instructions').value;
        const generateAboutAuthorinput = document.getElementById('generateAboutAuthorinput').value;
        return { gptVersion, gptRole, bookLength, genre, keywords, extraInstructions, generateAboutAuthorinput };
    }

    conceptButton.addEventListener('click', async () => {
        const { gptVersion, gptRole, bookLength, genre, keywords } = getInputValues();
        const prompt = `Generate a ${genre} concept, for a book that will have ${bookLength} words with keywords: ${keywords.join(', ')}. and a minimum of 10 chapters`;
        const concept = await generateContent(gptVersion, gptRole, prompt);
        conceptInput.value = concept;
    });

    contentButton.addEventListener('click', async () => {
        const { gptVersion, gptRole, genre, keywords } = getInputValues();
        disableInputsAndButtons([conceptInput], [conceptButton]);

        const concept = conceptInput.value;
        const prompt = `Based on the ${genre} concept: "${concept}" with keywords: ${keywords.join(', ')}, generate a table of contents. The table of contents should be only a list of chapters, no introductory or concluding text, no formatting, no empty lines, just a list of chapter names with a short description.`;

        const contents = await generateContent(gptVersion, gptRole, prompt);
        contentsInput.value = contents;
    });

    chaptersButton.addEventListener('click', async () => {
        const { gptVersion, gptRole, genre, keywords, extraInstructions } = getInputValues();
        disableInputsAndButtons([conceptInput, contentsInput], [conceptButton, contentButton]);

        tableOfContents = contentsInput.value.split('\n').filter(line => line.trim() !== '');

        if (currentLine < tableOfContents.length) {
            const prompt = `Based on the ${genre} chapter title: "${tableOfContents[currentLine]}" with keywords: ${keywords.join(', ')}., generate the chapter content using at least 2000 words total for the chapter and ${extraInstructions}`;
            let chapter = await generateContent(gptVersion, gptRole, prompt);

            chapter = chapter.replace(/\n/g, '<br/>\n');

            chaptersDiv.innerHTML += `<p>${chapter}</p><br/><br/>`;
            currentLine++;
            if (autoGenCheckbox.checked) {
                chaptersButton.click();
            }
        }
    });

    generateIntroductionButton.addEventListener('click', async () => {
        const { gptVersion, gptRole, genre, keywords } = getInputValues();
        const concept = conceptInput.value;
        const prompt = `Based on the ${genre} concept: "${concept}" with keywords: ${keywords.join(', ')}, generate an introduction for the book.`;
        const introduction = await generateContent(gptVersion, gptRole, prompt);
        introductionInput.value = introduction;
    });

    generateGlossaryButton.addEventListener('click', async () => {
        const { gptVersion, gptRole, genre, keywords } = getInputValues();
        const prompt = `Generate a glossary for a ${genre} book with keywords: ${keywords.join(', ')}.`;
        const glossary = await generateContent(gptVersion, gptRole, prompt);
        glossaryInput.value = glossary;
    });

    generateDescriptionAmazonButton.addEventListener('click', async () => {
        const { gptVersion, gptRole, genre, keywords } = getInputValues();
        const concept = conceptInput.value;
        const prompt = `Based on the ${genre} concept: "${concept}" with keywords: ${keywords.join(', ')}, generate a paragraph or 2 for a description for the books sales page.`;
        const description = await generateContent(gptVersion, gptRole, prompt);
        descriptionInput.value = description;
    });

    generate7KeywordsButton.addEventListener('click', async () => {
        const { gptVersion, gptRole, genre, keywords } = getInputValues();
        const prompt = `Generate the best 7 keywords for a ${genre} book with keywords: ${keywords.join(', ')}. for the books sales page`;
        const gen7keywords = await generateContent(gptVersion, gptRole, prompt);
        gen7keywordsInput.value = gen7keywords;
    });

    generateAboutAuthorButton.addEventListener('click', async () => {
        const { gptVersion, gptRole, genre, keywords, generateAboutAuthorinput } = getInputValues();
        const prompt = `Generate an "About the Author" page for ${generateAboutAuthorinput} for a ${genre} book with keywords: ${keywords.join(', ')}. `;
        const aboutAuthor = await generateContent(gptVersion, gptRole, prompt);
        aboutAuthorInput.value = aboutAuthor;
    });

    exportButton.addEventListener('click', () => {
        function stripHtml(html) {
            let tmp = document.createElement('div');
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || '';
        }

        const textContent = stripHtml(chaptersDiv.innerHTML);
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent));
        element.setAttribute('download', 'chapters.txt');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    });

    saveConceptButton.addEventListener('click', () => {
        const conceptContent = conceptInput.value;
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(conceptContent));
        element.setAttribute('download', 'concept.txt');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    });

    saveContentsButton.addEventListener('click', () => {
        const contentsContent = contentsInput.value;
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(contentsContent));
        element.setAttribute('download', 'table_of_contents.txt');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    });
});
