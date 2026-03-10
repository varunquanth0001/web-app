// Firebase Authentication Manager
class AuthManager {
    constructor() {
        this.auth = firebase.auth();
        this.db = firebase.database();
        this.isSigningUp = false;
        this.init();
    }

    init() {
        // If already logged in (and not during signup), redirect to dashboard
        this.auth.onAuthStateChanged((user) => {
            if (user && !this.isSigningUp) {
                window.location.href = 'index.html';
            }
        });
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePassword(password) {
        return password.length >= 6;
    }

    checkPasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[@$!%*?&#]/.test(password)) strength++;

        if (strength <= 2) return 'weak';
        if (strength <= 4) return 'medium';
        return 'strong';
    }

    getDefaultAvatar(name) {
        const colors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#10b981'];
        const initial = name.charAt(0).toUpperCase();
        const colorIndex = name.charCodeAt(0) % colors.length;
        return {
            type: 'initial',
            initial: initial,
            color: colors[colorIndex]
        };
    }

    async register(name, email, password, confirmPassword) {
        // Validation
        if (!name || name.trim().length < 2) {
            return { success: false, message: 'Name must be at least 2 characters' };
        }

        if (!this.validateEmail(email)) {
            return { success: false, message: 'Please enter a valid email address' };
        }

        if (!this.validatePassword(password)) {
            return { success: false, message: 'Password must be at least 6 characters' };
        }

        if (password !== confirmPassword) {
            return { success: false, message: 'Passwords do not match' };
        }

        try {
            // Set flag to prevent onAuthStateChanged redirect
            this.isSigningUp = true;

            // Create user with Firebase Auth
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update display name in Firebase Auth
            await user.updateProfile({ displayName: name.trim() });

            // Save user profile to Firebase Realtime Database
            const avatar = this.getDefaultAvatar(name);
            await this.db.ref('users/' + user.uid).set({
                name: name.trim(),
                email: email.toLowerCase(),
                avatar: avatar,
                bio: '',
                createdAt: new Date().toISOString(),
                eventsCreated: 0,
                eventsAttended: 0
            });

            // Sign out so user can login manually
            await this.auth.signOut();

            // Clear flag after signout
            this.isSigningUp = false;

            return { success: true, message: 'Account created successfully!' };

        } catch (error) {
            this.isSigningUp = false;
            let message = 'Registration failed';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    message = 'An account with this email already exists';
                    break;
                case 'auth/invalid-email':
                    message = 'Please enter a valid email address';
                    break;
                case 'auth/weak-password':
                    message = 'Password is too weak. Use at least 6 characters';
                    break;
                default:
                    message = error.message;
            }
            return { success: false, message: message };
        }
    }

    async login(email, password) {
        if (!this.validateEmail(email)) {
            return { success: false, message: 'Please enter a valid email address' };
        }

        if (!password) {
            return { success: false, message: 'Please enter your password' };
        }

        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            return { success: true, message: 'Login successful!' };

        } catch (error) {
            let message = 'Login failed';
            switch (error.code) {
                case 'auth/user-not-found':
                    message = 'No account found with this email';
                    break;
                case 'auth/wrong-password':
                    message = 'Incorrect password';
                    break;
                case 'auth/invalid-email':
                    message = 'Please enter a valid email address';
                    break;
                case 'auth/too-many-requests':
                    message = 'Too many failed attempts. Please try again later';
                    break;
                default:
                    message = error.message;
            }
            return { success: false, message: message };
        }
    }
}

// Initialize Auth Manager
const authManager = new AuthManager();

// UI Functions
function switchToSignup(e) {
    e.preventDefault();
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('signupForm').classList.add('active');
}

function switchToLogin(e) {
    e.preventDefault();
    document.getElementById('signupForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

function checkPasswordStrength(password) {
    const strength = authManager.checkPasswordStrength(password);
    const strengthBar = document.getElementById('strengthBarFill');
    const strengthText = document.getElementById('strengthText');

    strengthBar.classList.remove('strength-weak', 'strength-medium', 'strength-strong');

    switch (strength) {
        case 'weak':
            strengthBar.style.width = '33%';
            strengthBar.classList.add('strength-weak');
            strengthText.textContent = 'Weak password';
            break;
        case 'medium':
            strengthBar.style.width = '66%';
            strengthBar.classList.add('strength-medium');
            strengthText.textContent = 'Medium strength';
            break;
        case 'strong':
            strengthBar.style.width = '100%';
            strengthBar.classList.add('strength-strong');
            strengthText.textContent = 'Strong password';
            break;
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const result = await authManager.login(email, password);

    if (result.success) {
        showToast(result.message, 'success');
        // Firebase onAuthStateChanged will handle redirect
    } else {
        showToast(result.message, 'error');
    }
}

async function handleSignup(e) {
    e.preventDefault();

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    const result = await authManager.register(name, email, password, confirmPassword);

    if (result.success) {
        showToast('Account created successfully! Please login.', 'success');

        // Clear signup form
        document.getElementById('signupFormElement').reset();

        // Switch to login form after 1.5 seconds
        setTimeout(() => {
            switchToLogin(new Event('click'));
        }, 1500);
    } else {
        showToast(result.message, 'error');
    }
}

// Check for URL parameters (e.g., ?signup=true)
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('signup') === 'true') {
        switchToSignup(new Event('click'));
    }
});
