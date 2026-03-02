// dashboard.js - Handles UI states like sidebar, dropdowns, and dark mode

document.addEventListener('DOMContentLoaded', () => {

    // 1. Sidebar Toggle (Desktop Collapse)
    const sidebar = document.getElementById('sidebar');
    const collapseBtn = document.getElementById('collapse-sidebar');

    if (collapseBtn && sidebar) {
        collapseBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // 2. Mobile Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const overlay = document.getElementById('sidebar-overlay');

    function toggleMobileMenu() {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    }

    if (menuToggle && sidebar && overlay) {
        menuToggle.addEventListener('click', toggleMobileMenu);
        overlay.addEventListener('click', toggleMobileMenu);
    }

    // 3. Dropdown Menus (Profile & Notifications)
    const notifBtn = document.getElementById('notif-btn');
    const notifMenu = document.getElementById('notif-menu');

    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');

    function closeAllDropdowns() {
        if (notifMenu) notifMenu.classList.remove('active');
        if (profileMenu) profileMenu.classList.remove('active');
    }

    if (notifBtn && notifMenu) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = notifMenu.classList.contains('active');
            closeAllDropdowns();
            if (!isActive) notifMenu.classList.add('active');
        });
    }

    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = profileMenu.classList.contains('active');
            closeAllDropdowns();
            if (!isActive) profileMenu.classList.add('active');
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        closeAllDropdowns();
    });

    // Prevent closing when clicking inside dropdown
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    // 4. Dark Mode Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const themeIcon = themeToggle ? themeToggle.querySelector('i') : null;

    // Check system preference or localStorage (simplified for demo)
    let isDarkMode = false; // Based on initial light-mode class in HTML

    if (themeToggle && themeIcon) {
        themeToggle.addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            if (isDarkMode) {
                body.classList.remove('light-mode');
                body.classList.add('dark-mode');
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.remove('far');
                themeIcon.classList.add('fa-sun');
                themeIcon.classList.add('fas');
            } else {
                body.classList.remove('dark-mode');
                body.classList.add('light-mode');
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.remove('fas');
                themeIcon.classList.add('fa-moon');
                themeIcon.classList.add('far');
            }
        });
    }
});
