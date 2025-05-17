// API pour communiquer avec le backend
const API_BASE_URL = '/api';

export async function getElements() {
    try {
        const response = await fetch(`${API_BASE_URL}/elements`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching elements:', error);
        return [];
    }
}

export async function savePage(pageData) {
    try {
        const response = await fetch(`${API_BASE_URL}/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(pageData)
        });
        return await response.json();
    } catch (error) {
        console.error('Error saving page:', error);
        return { status: 'error', message: error.message };
    }
}