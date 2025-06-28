// Notes Management Module
class NotesManager {
    constructor() {
        this.db = window.db;
        this.auth = window.auth;
        this.notes = [];
        this.currentNoteId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add note button
        document.getElementById('addNoteBtn').addEventListener('click', () => {
            this.showNoteModal();
        });

        // Modal close button
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideNoteModal();
        });

        // Cancel button
        document.getElementById('cancelNote').addEventListener('click', () => {
            this.hideNoteModal();
        });

        // Note form submission
        document.getElementById('noteForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNote();
        });

        // Close modal when clicking outside
        document.getElementById('noteModal').addEventListener('click', (e) => {
            if (e.target.id === 'noteModal') {
                this.hideNoteModal();
            }
        });
    }

    showNoteModal(noteId = null) {
        const modal = document.getElementById('noteModal');
        const modalTitle = document.getElementById('modalTitle');
        const titleInput = document.getElementById('noteTitle');
        const contentInput = document.getElementById('noteContent');

        this.currentNoteId = noteId;

        if (noteId) {
            // Edit mode
            const note = this.notes.find(n => n.id === noteId);
            if (note) {
                modalTitle.textContent = 'Edit Note';
                titleInput.value = note.title;
                contentInput.value = note.content;
            }
        } else {
            // Add mode
            modalTitle.textContent = 'Add New Note';
            titleInput.value = '';
            contentInput.value = '';
        }

        modal.style.display = 'flex';
        titleInput.focus();
    }

    hideNoteModal() {
        const modal = document.getElementById('noteModal');
        modal.style.display = 'none';
        this.currentNoteId = null;
    }

    async saveNote() {
        const title = document.getElementById('noteTitle').value.trim();
        const content = document.getElementById('noteContent').value.trim();

        if (!title || !content) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        const user = this.auth.currentUser;
        if (!user) {
            this.showNotification('You must be logged in to save notes', 'error');
            return;
        }

        try {
            const submitBtn = document.querySelector('#noteForm button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span>Saving...';

            const noteData = {
                title,
                content,
                userId: user.uid,
                createdAt: this.currentNoteId ? null : new Date(),
                updatedAt: new Date()
            };

            if (this.currentNoteId) {
                // Update existing note
                await this.db.collection('notes').doc(this.currentNoteId).update(noteData);
                this.showNotification('Note updated successfully!', 'success');
            } else {
                // Create new note
                await this.db.collection('notes').add(noteData);
                this.showNotification('Note created successfully!', 'success');
            }

            this.hideNoteModal();
            this.loadNotes();
        } catch (error) {
            console.error('Error saving note:', error);
            this.showNotification('Error saving note. Please try again.', 'error');
        } finally {
            const submitBtn = document.querySelector('#noteForm button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Note';
        }
    }

    async loadNotes() {
        const user = this.auth.currentUser;
        if (!user) return;

        try {
            const notesContainer = document.getElementById('notesContainer');
            notesContainer.innerHTML = '<div class="loading">Loading notes...</div>';

            const snapshot = await this.db
                .collection('notes')
                .where('userId', '==', user.uid)
                .orderBy('updatedAt', 'desc')
                .get();

            this.notes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.renderNotes();
        } catch (error) {
            console.error('Error loading notes:', error);
            this.showNotification('Error loading notes', 'error');
        }
    }

    renderNotes() {
        const notesContainer = document.getElementById('notesContainer');

        if (this.notes.length === 0) {
            notesContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No notes yet</h3>
                    <p>Create your first note to get started!</p>
                </div>
            `;
            return;
        }

        notesContainer.innerHTML = this.notes.map(note => this.createNoteCard(note)).join('');
    }

    createNoteCard(note) {
        const date = new Date(note.updatedAt?.toDate() || note.updatedAt);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="note-card" data-note-id="${note.id}">
                <div class="note-header">
                    <h3 class="note-title">${this.escapeHtml(note.title)}</h3>
                    <div class="note-actions">
                        <button class="note-action-btn" onclick="notesManager.editNote('${note.id}')" title="Edit">
                            ✏️
                        </button>
                        <button class="note-action-btn" onclick="notesManager.deleteNote('${note.id}')" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="note-content">${this.escapeHtml(note.content)}</div>
                <div class="note-date">${formattedDate}</div>
            </div>
        `;
    }

    editNote(noteId) {
        this.showNoteModal(noteId);
    }

    async deleteNote(noteId) {
        if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
            return;
        }

        try {
            await this.db.collection('notes').doc(noteId).delete();
            this.showNotification('Note deleted successfully!', 'success');
            this.loadNotes();
        } catch (error) {
            console.error('Error deleting note:', error);
            this.showNotification('Error deleting note', 'error');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Use the auth manager's notification system if available
        if (window.authManager && window.authManager.showNotification) {
            window.authManager.showNotification(message, type);
        } else {
            // Fallback notification
            alert(message);
        }
    }
}

// Utility Functions
class Utils {
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
}

// Search functionality
class SearchManager {
    constructor(notesManager) {
        this.notesManager = notesManager;
        this.setupSearch();
    }

    setupSearch() {
        // Add search input to the notes header
        const notesHeader = document.querySelector('.notes-header');
        if (notesHeader) {
            const searchHTML = `
                <div class="search-container">
                    <input type="text" id="searchInput" placeholder="Search notes..." class="search-input">
                </div>
            `;
            notesHeader.insertAdjacentHTML('beforeend', searchHTML);

            // Add search styles
            const searchStyles = `
                <style>
                    .search-container {
                        margin-left: auto;
                    }
                    .search-input {
                        padding: 0.5rem 1rem;
                        border: 1px solid rgba(74, 85, 104, 0.2);
                        border-radius: 8px;
                        font-size: 0.9rem;
                        width: 250px;
                        transition: border-color 0.2s ease, box-shadow 0.2s ease;
                    }
                    .search-input:focus {
                        outline: none;
                        border-color: #667eea;
                        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                    }
                    @media (max-width: 768px) {
                        .search-input {
                            width: 100%;
                            margin-top: 1rem;
                        }
                        .notes-header {
                            flex-direction: column;
                            align-items: stretch;
                        }
                    }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', searchStyles);

            // Add search functionality
            const searchInput = document.getElementById('searchInput');
            const debouncedSearch = Utils.debounce((query) => {
                this.searchNotes(query);
            }, 300);

            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        }
    }

    searchNotes(query) {
        const filteredNotes = this.notesManager.notes.filter(note => {
            const searchTerm = query.toLowerCase();
            return note.title.toLowerCase().includes(searchTerm) ||
                   note.content.toLowerCase().includes(searchTerm);
        });

        this.renderFilteredNotes(filteredNotes);
    }

    renderFilteredNotes(notes) {
        const notesContainer = document.getElementById('notesContainer');

        if (notes.length === 0) {
            notesContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No notes found</h3>
                    <p>Try adjusting your search terms</p>
                </div>
            `;
            return;
        }

        notesContainer.innerHTML = notes.map(note => this.notesManager.createNoteCard(note)).join('');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase to be initialized
    const checkFirebase = setInterval(() => {
        if (window.db && window.auth) {
            clearInterval(checkFirebase);
            
            // Initialize notes manager
            window.notesManager = new NotesManager();
            
            // Initialize search manager
            window.searchManager = new SearchManager(window.notesManager);
            
            console.log('Notes manager initialized successfully');
        }
    }, 100);
}); 