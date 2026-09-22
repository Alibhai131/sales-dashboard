// ============================================
//  SALES DASHBOARD - Main App JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    
    // === Sidebar Toggle (Mobile) ===
    const sidebar = document.getElementById('sidebar');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function() {
            sidebar.classList.add('open');
            sidebarOverlay.classList.add('active');
        });
    }
    
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', closeSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    }
    
    // === Theme Toggle ===
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = document.getElementById('themeIcon');
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.className = savedTheme;
    updateThemeIcon(savedTheme);
    
    if (themeBtn) {
        themeBtn.addEventListener('click', function() {
            const currentTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.body.className = newTheme;
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }
    
    function updateThemeIcon(theme) {
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }
    
    // === User Profile Dropdown ===
    const userProfile = document.getElementById('userProfile');
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (userProfile) {
        userProfile.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });
    }
    
    // === Notification Panel ===
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationPanel = document.getElementById('notificationPanel');
    
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationPanel.classList.toggle('show');
        });
    }
    
    // Mark All Read
    const markAllRead = document.getElementById('markAllRead');
    if (markAllRead) {
        markAllRead.addEventListener('click', async function() {
            try {
                await fetch('/api/notifications/read-all', { method: 'PUT' });
                document.querySelectorAll('.notification-item.unread').forEach(item => {
                    item.classList.remove('unread');
                });
                const dot = document.querySelector('.notification-dot');
                if (dot) dot.remove();
            } catch(err) {
                console.error('Error marking notifications as read');
            }
        });
    }
    
    // Close dropdowns on outside click
    document.addEventListener('click', function() {
        if (profileDropdown) profileDropdown.classList.remove('show');
        if (notificationPanel) notificationPanel.classList.remove('show');
    });
    
    // Prevent panel close on click inside
    if (notificationPanel) {
        notificationPanel.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
        // === Currency Selector ===
    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect) {
        currencySelect.addEventListener('change', async function() {
            const currency = this.value;
            try {
                const res = await fetch('/api/settings/currency', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currency })
                });
                const data = await res.json();
                if (data.success) {
                    location.reload(); // Reloads page with new currency symbol!
                } else {
                    alert(data.message || 'Failed to update currency');
                }
            } catch(err) {
                console.error('Error updating currency:', err);
            }
        });
    }
    
    // === Auto-dismiss flash messages ===
    const flashMessage = document.getElementById('flashMessage');
    if (flashMessage) {
        setTimeout(() => {
            flashMessage.style.opacity = '0';
            flashMessage.style.transform = 'translateY(-10px)';
            setTimeout(() => flashMessage.remove(), 300);
        }, 4000);
    }
    
    // === Date Filter ===
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', function() {
            const currentUrl = new URL(window.location);
            currentUrl.searchParams.set('date', this.value);
            window.location.href = currentUrl.toString();
        });
    }
    
    // === Polling for new notifications (every 30 seconds) ===
    setInterval(async () => {
        try {
            const res = await fetch('/api/notifications/unread-count');
            const data = await res.json();
            if (data.success) {
                const dot = document.querySelector('.notification-dot');
                const navBadge = document.querySelector('.nav-badge');
                
                if (data.count > 0) {
                    if (dot) {
                        dot.textContent = data.count;
                    } else {
                        const btn = document.querySelector('.notification-btn');
                        if (btn) {
                            const newDot = document.createElement('span');
                            newDot.className = 'notification-dot';
                            newDot.textContent = data.count;
                            btn.appendChild(newDot);
                        }
                    }
                    if (navBadge) navBadge.textContent = data.count;
                }
            }
        } catch(err) {
            // Silently fail
        }
    }, 30000);
    
});

// === Global Toast Function ===
function showToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// === Format Currency Helper ===
function formatCurrency(amount, currency = 'USD') {
    const symbols = {
        USD: '$', GBP: '£', PKR: '₨', INR: '₹', EUR: '€', AED: 'د.إ'
    };
    const symbol = symbols[currency] || '$';
    return `${symbol}${Number(amount).toLocaleString()}`;
}