// Authentication Module
class AuthManager {
    constructor() {
        this.auth = window.auth;
        this.currentUser = null;
        this.init();
    }

    init() {
        console.log('AuthManager initializing...');
        
        // Listen for auth state changes
        this.auth.onAuthStateChanged((user) => {
            console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
            this.currentUser = user;
            this.updateUI(user);
        });

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login button
        document.getElementById('loginBtn').addEventListener('click', () => {
            console.log('Login button clicked');
            this.showAuthModal('login');
        });

        // Signup button
        document.getElementById('signupBtn').addEventListener('click', () => {
            console.log('Signup button clicked');
            this.showAuthModal('signup');
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            console.log('Logout button clicked');
            this.logout();
        });
    }

    showAuthModal(type) {
        console.log('Showing auth modal for:', type);
        const isLogin = type === 'login';
        const title = isLogin ? 'Login' : 'Sign Up';
        
        // Create modal HTML
        const modalHTML = `
            <div class="modal" id="authModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="authForm">
                            <div class="form-group">
                                <label for="email">Email</label>
                                <input type="email" id="email" name="email" required>
                            </div>
                            <div class="form-group">
                                <label for="password">Password</label>
                                <input type="password" id="password" name="password" required>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                                <button type="submit" class="btn btn-primary">${title}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Handle form submission
        document.getElementById('authForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            console.log('Form submitted:', { type, email });
            
            if (isLogin) {
                this.login(email, password);
            } else {
                this.signup(email, password);
            }
        });
    }

    async login(email, password) {
        console.log('Attempting login for:', email);
        try {
            const button = document.querySelector('#authForm button[type="submit"]');
            button.disabled = true;
            button.innerHTML = '<span class="spinner"></span>Logging in...';

            await this.auth.signInWithEmailAndPassword(email, password);
            
            // Close modal
            document.getElementById('authModal').remove();
            
            this.showNotification('Login successful!', 'success');
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification(this.getErrorMessage(error), 'error');
            const button = document.querySelector('#authForm button[type="submit"]');
            button.disabled = false;
            button.textContent = 'Login';
        }
    }

    async signup(email, password) {
        console.log('Attempting signup for:', email);
        try {
            const button = document.querySelector('#authForm button[type="submit"]');
            button.disabled = true;
            button.innerHTML = '<span class="spinner"></span>Creating account...';

            await this.auth.createUserWithEmailAndPassword(email, password);
            
            // Close modal
            document.getElementById('authModal').remove();
            
            this.showNotification('Account created successfully!', 'success');
        } catch (error) {
            console.error('Signup error:', error);
            this.showNotification(this.getErrorMessage(error), 'error');
            const button = document.querySelector('#authForm button[type="submit"]');
            button.disabled = false;
            button.textContent = 'Sign Up';
        }
    }

    async logout() {
        console.log('Attempting logout');
        try {
            await this.auth.signOut();
            this.showNotification('Logged out successfully!', 'success');
        } catch (error) {
            console.error('Logout error:', error);
            this.showNotification('Error logging out', 'error');
        }
    }

    updateUI(user) {
        console.log('Updating UI for user:', user ? user.email : 'no user');
        const authSection = document.getElementById('authSection');
        const notesSection = document.getElementById('notesSection');
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        if (user) {
            // User is logged in
            authSection.style.display = 'none';
            notesSection.style.display = 'block';
            loginBtn.style.display = 'none';
            signupBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            
            // Load user's notes
            if (window.notesManager) {
                window.notesManager.loadNotes();
            }
        } else {
            // User is logged out
            authSection.style.display = 'flex';
            notesSection.style.display = 'none';
            loginBtn.style.display = 'inline-block';
            signupBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
        }
    }

    getErrorMessage(error) {
        console.log('Error code:', error.code);
        switch (error.code) {
            case 'auth/user-not-found':
                return 'No account found with this email address.';
            case 'auth/wrong-password':
                return 'Incorrect password.';
            case 'auth/email-already-in-use':
                return 'An account with this email already exists.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters long.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your internet connection.';
            case 'auth/operation-not-allowed':
                return 'Email/password authentication is not enabled. Please contact support.';
            default:
                return `An error occurred: ${error.message}`;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }
}

// Add notification animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }
    
    .notification-close:hover {
        opacity: 0.8;
    }
`;
document.head.appendChild(style);

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
}); 