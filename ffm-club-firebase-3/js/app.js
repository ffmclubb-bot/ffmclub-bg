// Main Application JavaScript for FFM Club
// This file initializes the app and handles common functionality

import { auth } from './firebase-config.js';
import { checkAuthState } from './auth.js';

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('FFM Club App Initialized');
    
    // Check authentication state
    checkAuthState((user) => {
        if (user) {
            console.log('User is logged in:', user.email);
            updateUIForLoggedInUser();
        } else {
            console.log('User is not logged in');
            updateUIForLoggedOutUser();
        }
    });
});

/**
 * Update UI elements for logged-in users
 */
function updateUIForLoggedInUser() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Don't redirect if user is on login or register page
    // (they might be checking those pages while logged in)
    
    // Update navigation if needed
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        const registerLink = navMenu.querySelector('a[href="register.html"]');
        if (registerLink) {
            const listItem = registerLink.parentElement;
            listItem.innerHTML = '<a href="dashboard.html" class="btn-register">Профил</a>';
        }
    }
}

/**
 * Update UI elements for logged-out users
 */
function updateUIForLoggedOutUser() {
    // Restore default navigation
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        // Navigation is already set up in HTML
    }
}

/**
 * Show loading indicator
 */
export function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'flex';
    }
}

/**
 * Hide loading indicator
 */
export function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

/**
 * Display notification message
 * @param {string} message - Message to display
 * @param {string} type - Type of message ('success', 'error', 'info')
 */
export function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Make utility functions available globally
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showNotification = showNotification;
