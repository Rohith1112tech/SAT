/* ==========================================================================
   Srii Angalamman Travels - Admin Dashboard Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 0. Initialize & Load Credentials from LocalStorage
    // ==========================================
    if (!localStorage.getItem('adminEmail')) {
        localStorage.setItem('adminEmail', 'admin@satravels.com');
        localStorage.setItem('adminPassword', 'admin123');
        localStorage.setItem('adminPhone', '+91 98765 43210');
    }

    // ==========================================
    // 1. Session & Login Flow
    // ==========================================
    const loginWrapper = document.getElementById('loginWrapper');
    const dashboardWrapper = document.getElementById('dashboardWrapper');
    const loginForm = document.getElementById('adminLoginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('adminLogoutBtn');

    // Update avatar initials letter on load
    const updateAdminInitials = () => {
        const email = localStorage.getItem('adminEmail') || 'admin@satravels.com';
        const avatar = document.getElementById('adminAvatarInitials');
        if (avatar) {
            avatar.innerHTML = `<span class="avatar-letter">${email.charAt(0).toUpperCase()}</span><span class="active-status"></span>`;
        }
    };
    updateAdminInitials();

    // Check login state on load
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        bypassLogin();
    }

    function bypassLogin() {
        loginWrapper.classList.add('hidden');
        dashboardWrapper.classList.remove('hidden');
        initializeDashboard();
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('adminEmail').value.trim();
            const passwordInput = document.getElementById('adminPassword').value;

            const storedEmail = localStorage.getItem('adminEmail');
            const storedPassword = localStorage.getItem('adminPassword');

            if (emailInput === storedEmail && passwordInput === storedPassword) {
                // Successful Auth
                loginError.textContent = "";
                sessionStorage.setItem('adminLoggedIn', 'true');
                
                // Transition UI
                loginWrapper.classList.add('hidden');
                dashboardWrapper.classList.remove('hidden');
                updateAdminInitials();
                initializeDashboard();
            } else {
                // Failed Auth
                loginError.textContent = "Invalid email or password. Please try again.";
                document.getElementById('adminPassword').value = "";
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('adminLoggedIn');
            dashboardWrapper.classList.add('hidden');
            loginWrapper.classList.remove('hidden');
            // Clear passwords
            document.getElementById('adminPassword').value = "";
        });
    }

    // Forgot Password Flow
    const forgotLink = document.querySelector('.forgot-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            const inputPhone = prompt("Enter your Recovery Mobile Number to reset password:\n(Hint: Default is +91 98765 43210)");
            if (inputPhone === null) return; // User cancelled
            
            const storedPhone = localStorage.getItem('adminPhone') || '+91 98765 43210';
            if (inputPhone.trim() === storedPhone) {
                alert(`Access Verified!\nYour administrator password is: "${localStorage.getItem('adminPassword')}"`);
            } else {
                alert("Error: Recovery mobile number does not match our records.");
            }
        });
    }

    // Theme Switch implementation
    const themeSwitch = document.querySelector('.theme-switch');
    if (themeSwitch) {
        const toggleKnob = themeSwitch.querySelector('.toggle-knob');
        
        const applyTheme = (isDark) => {
            if (isDark) {
                document.body.classList.add('dark-theme');
                if (toggleKnob) toggleKnob.style.transform = 'translateX(18px)';
            } else {
                document.body.classList.remove('dark-theme');
                if (toggleKnob) toggleKnob.style.transform = 'translateX(0)';
            }
        };

        // Load saved state
        const savedDark = localStorage.getItem('adminDarkTheme') === 'true';
        applyTheme(savedDark);

        themeSwitch.addEventListener('click', () => {
            const currentDark = document.body.classList.contains('dark-theme');
            const nextDark = !currentDark;
            localStorage.setItem('adminDarkTheme', nextDark);
            applyTheme(nextDark);
        });
    }

    // ==========================================
    // 2. State & Data Handling (PostgreSQL Backed)
    // ==========================================
    let bookings = [];
    let feedbackData = [];

    // ==========================================
    // 3. Dashboard Initialization & Rendering
    // ==========================================
    const tableBody = document.getElementById('bookingsTableBody');
    const searchInput = document.getElementById('tableSearch');
    const feedbackList = document.getElementById('feedbackList');

    function initializeDashboard() {
        loadBookings();
        loadFeedback();
    }

    // Load bookings from API
    function loadBookings() {
        fetch('/api/bookings')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load bookings');
                return res.json();
            })
            .then(data => {
                bookings = data;
                renderTable(bookings);
                updateAnalytics();
            })
            .catch(err => {
                console.error('Error fetching bookings:', err);
            });
    }

    // Load feedback from API
    function loadFeedback() {
        fetch('/api/feedback')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load feedback');
                return res.json();
            })
            .then(data => {
                feedbackData = data;
                renderFeedback();
            })
            .catch(err => {
                console.error('Error fetching feedback:', err);
            });
    }

    // Analytics counters updater
    function updateAnalytics() {
        const currentTotal = bookings.length;
        const currentPending = bookings.filter(b => b.status === 'Pending').length;
        const currentConfirmed = bookings.filter(b => b.status === 'Confirmed').length;
        const currentCompleted = bookings.filter(b => b.status === 'Completed').length;

        document.getElementById('statTotal').textContent = currentTotal;
        document.getElementById('statPending').textContent = currentPending;
        document.getElementById('statConfirmed').textContent = currentConfirmed;
        document.getElementById('statCompleted').textContent = currentCompleted;
    }

    // Bookings Table Renderer
    function renderTable(dataList) {
        if (!tableBody) return;
        tableBody.innerHTML = "";

        if (dataList.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center" style="padding: 3rem; color: #64748B;">
                        <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 0.75rem; display: block; opacity: 0.5;"></i>
                        No travel requests match your search criteria.
                    </td>
                </tr>
            `;
            return;
        }

        dataList.forEach(booking => {
            const tr = document.createElement('tr');
            
            // Format status badge class
            let badgeClass = "badge-pending";
            if (booking.status === 'Confirmed') badgeClass = "badge-confirmed";
            if (booking.status === 'Completed') badgeClass = "badge-completed";

            // Format Action buttons based on state
            let actionButtons = "";
            if (booking.status === 'Pending') {
                actionButtons = `
                    <button class="btn btn-action btn-confirm" onclick="updateStatus(${booking.id}, 'Confirmed')">Confirm</button>
                    <button class="btn btn-action btn-complete" onclick="updateStatus(${booking.id}, 'Completed')">Complete</button>
                `;
            } else if (booking.status === 'Confirmed') {
                actionButtons = `
                    <button class="btn btn-action btn-complete" onclick="updateStatus(${booking.id}, 'Completed')">Complete</button>
                `;
            }

            // Initials helper
            const getInitials = (nameStr) => {
                if (!nameStr) return 'U';
                const parts = nameStr.trim().split(' ');
                if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
                return nameStr[0].toUpperCase();
            };

            tr.innerHTML = `
                <td><strong>${formatDate(booking.booking_date)}</strong></td>
                <td>
                    <div class="user-profile-cell">
                        <div class="user-initials-avatar">${getInitials(booking.name)}</div>
                        <div class="user-cell-details">
                            <span class="cust-name">${booking.name}</span>
                            <span class="cust-phone">${booking.phone}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="route-text">${booking.pickup} ➔ ${booking.dropoff}</span>
                    <br><small style="color: #64748B;">${booking.trip_type}</small>
                </td>
                <td><span class="vehicle-text">${booking.vehicle}</span></td>
                <td class="text-center"><strong>${booking.passengers}</strong></td>
                <td><span class="status-badge ${badgeClass}">${booking.status}</span></td>
                <td>
                    <div class="table-actions">
                        ${actionButtons}
                        <button class="btn btn-delete" onclick="deleteBooking(${booking.id})" title="Delete Quote">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            `;

            tableBody.appendChild(tr);
        });
    }

    // Feedback Critique Panel Renderer
    function renderFeedback() {
        if (!feedbackList) return;
        feedbackList.innerHTML = '';

        if (feedbackData.length === 0) {
            feedbackList.innerHTML = `<div class="text-center" style="padding:2rem;color:#64748B;">No critiques received yet.</div>`;
            return;
        }

        feedbackData.forEach(item => {
            const div = document.createElement('div');
            div.className = 'feedback-item';
            div.style.position = 'relative';

            let starsMarkup = '';
            for (let i = 1; i <= 5; i++) {
                starsMarkup += i <= item.rating
                    ? `<i class="fa-solid fa-star"></i> `
                    : `<i class="fa-regular fa-star"></i> `;
            }

            div.innerHTML = `
                <div class="feedback-meta">
                    <span class="feedback-user">${item.name}</span>
                    <span class="feedback-date">${formatDate(item.created_at)}</span>
                </div>
                <div class="feedback-stars">${starsMarkup}</div>
                <div class="feedback-critique">"${item.critique}"</div>
                <button onclick="deleteFeedback(${item.id}, this)" title="Delete" style="position:absolute;top:0.75rem;right:0.75rem;background:#FEF2F2;color:#DC2626;border:none;border-radius:6px;padding:0.3rem 0.65rem;font-size:0.78rem;font-weight:600;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
            `;
            feedbackList.appendChild(div);
        });
    }

    window.deleteFeedback = function(id, btn) {
        if (!confirm('Delete this feedback entry permanently?')) return;
        btn.disabled = true;
        fetch(`/api/feedback/${id}`, { method: 'DELETE' })
            .then(r => r.json())
            .then(() => {
                feedbackData = feedbackData.filter(f => f.id !== id);
                renderFeedback();
            })
            .catch(() => { btn.disabled = false; alert('Delete failed. Try again.'); });
    };

    // ==========================================
    // 4. Global Action Functions (Database Updates & Searches)
    // ==========================================
    
    // Status Toggling in DB
    window.updateStatus = (id, newStatus) => {
        fetch(`/api/bookings/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to update status');
            return res.json();
        })
        .then(() => {
            loadBookings(); // Reload to refresh tables and stats
        })
        .catch(err => {
            console.error('Error updating status:', err);
            alert('Failed to update status in PostgreSQL. Please try again.');
        });
    };

    // Row Deletion in DB
    window.deleteBooking = (id) => {
        if (confirm(`Are you sure you want to delete quote request #${id}?`)) {
            fetch(`/api/bookings/${id}`, {
                method: 'DELETE'
            })
            .then(res => {
                if (!res.ok) throw new Error('Failed to delete booking');
                return res.json();
            })
            .then(() => {
                loadBookings(); // Reload to refresh tables and stats
            })
            .catch(err => {
                console.error('Error deleting booking:', err);
                alert('Failed to delete booking from PostgreSQL. Please try again.');
            });
        }
    };

    function updateDashboardView() {
        // Apply current search filters if any
        const query = searchInput.value.toLowerCase().trim();
        const filtered = bookings.filter(b => 
            b.name.toLowerCase().includes(query) || 
            b.pickup.toLowerCase().includes(query) || 
            b.dropoff.toLowerCase().includes(query) ||
            b.vehicle.toLowerCase().includes(query)
        );

        renderTable(filtered);
    }

    // Search input listener
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            updateDashboardView();
        });
    }

    // Sidebar Tab View Toggling
    const menuItems = document.querySelectorAll('.menu-item[data-tab]');
    const tabViews = document.querySelectorAll('.tab-view');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = item.getAttribute('data-tab');
            
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');
            
            tabViews.forEach(view => {
                if (view.id === `tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`) {
                    view.classList.add('active');
                    
                    if (tabName === 'settings') {
                        const settingsEmail = document.getElementById('settingsEmail');
                        const settingsPhone = document.getElementById('settingsPhone');
                        if (settingsEmail) settingsEmail.value = localStorage.getItem('adminEmail') || 'admin@satravels.com';
                        if (settingsPhone) settingsPhone.value = localStorage.getItem('adminPhone') || '+91 98765 43210';
                        const settingsMsg = document.getElementById('settingsMessage');
                        if (settingsMsg) settingsMsg.style.display = 'none';
                    }

                    if (tabName === 'fleet') {
                        loadAdminFleet();
                    }

                    if (tabName === 'contact') {
                        loadContactSettings();
                    }

                    if (tabName === 'reviews') {
                        loadAdminReviews();
                    }
                } else {
                    view.classList.remove('active');
                }
            });
        });
    });

    // Handle Admin Settings submission
    const settingsForm = document.getElementById('adminSettingsForm');
    const settingsMessage = document.getElementById('settingsMessage');
    
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const newEmail = document.getElementById('settingsEmail').value.trim();
            const newPhone = document.getElementById('settingsPhone').value.trim();
            const newPassword = document.getElementById('settingsPassword').value;
            const confirmPassword = document.getElementById('settingsConfirmPassword').value;

            if (newPassword) {
                if (newPassword !== confirmPassword) {
                    settingsMessage.style.display = 'block';
                    settingsMessage.style.color = '#EF4444';
                    settingsMessage.textContent = 'Error: Passwords do not match!';
                    return;
                }
                localStorage.setItem('adminPassword', newPassword);
            }

            localStorage.setItem('adminEmail', newEmail);
            localStorage.setItem('adminPhone', newPhone);

            // Update avatar initials dynamically
            const adminAvatar = document.getElementById('adminAvatarInitials');
            if (adminAvatar) {
                adminAvatar.innerHTML = `<span class="avatar-letter">${newEmail.charAt(0).toUpperCase()}</span><span class="active-status"></span>`;
            }

            settingsMessage.style.display = 'block';
            settingsMessage.style.color = '#10B981';
            settingsMessage.textContent = 'Settings saved successfully!';
            
            // Reset passwords inputs
            document.getElementById('settingsPassword').value = "";
            document.getElementById('settingsConfirmPassword').value = "";
            
            setTimeout(() => {
                settingsMessage.style.display = 'none';
            }, 3000);
        });
    }


    // Format helper for dates
    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-US', options);
    }

    // ==========================================
    // FLEET MANAGER
    // ==========================================
    let fleetData = [];
    let vehiclePhotos = []; // working photo list for current form

    function loadAdminFleet() {
        fetch('/api/admin/fleet')
            .then(r => r.json())
            .then(data => {
                fleetData = data;
                renderFleetTable();
            })
            .catch(err => console.error('Fleet load error:', err));
    }

    function renderFleetTable() {
        const tbody = document.getElementById('fleetAdminTableBody');
        if (!tbody) return;
        if (fleetData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#94A3B8;">No vehicles yet. Click "Add Vehicle" to get started.</td></tr>`;
            return;
        }
        tbody.innerHTML = fleetData.map(v => `
            <tr>
                <td><img src="${v.photos[0] || 'assets/innova.jpg'}" alt="${v.name}" style="width:60px;height:45px;object-fit:cover;border-radius:6px;"></td>
                <td style="font-weight:600;">${v.name}</td>
                <td><span style="background:#EEF2FF;color:#4F46E5;padding:0.25rem 0.75rem;border-radius:20px;font-size:0.78rem;font-weight:600;">${v.badge}</span></td>
                <td>${v.seats}</td>
                <td><span style="background:#F0FDF4;color:#16A34A;padding:0.25rem 0.65rem;border-radius:20px;font-size:0.78rem;font-weight:600;">${v.photos.length} photo${v.photos.length !== 1 ? 's' : ''}</span></td>
                <td><span style="background:${v.is_active ? '#F0FDF4' : '#FEF2F2'};color:${v.is_active ? '#16A34A' : '#DC2626'};padding:0.25rem 0.65rem;border-radius:20px;font-size:0.78rem;font-weight:600;">${v.is_active ? 'Active' : 'Hidden'}</span></td>
                <td style="text-align:center;">
                    <button onclick="editVehicle(${v.id})" style="padding:0.35rem 0.75rem;background:#EEF2FF;color:#4F46E5;border:none;border-radius:6px;font-weight:600;cursor:pointer;margin-right:0.4rem;"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="toggleVehicleStatus(${v.id}, ${!v.is_active})" style="padding:0.35rem 0.75rem;background:${v.is_active ? '#FFF7ED' : '#F0FDF4'};color:${v.is_active ? '#EA580C' : '#16A34A'};border:none;border-radius:6px;font-weight:600;cursor:pointer;margin-right:0.4rem;">${v.is_active ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>'}</button>
                    <button onclick="deleteVehicle(${v.id})" style="padding:0.35rem 0.75rem;background:#FEF2F2;color:#DC2626;border:none;border-radius:6px;font-weight:600;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    function renderPhotoPreview() {
        const list = document.getElementById('photoPreviewList');
        if (!list) return;
        list.innerHTML = vehiclePhotos.map((url, idx) => `
            <div style="position:relative;width:90px;">
                <img src="${url}" style="width:90px;height:68px;object-fit:cover;border-radius:8px;border:2px solid ${idx===0?'#4F46E5':'#E2E8F0'};">
                ${idx === 0 ? '<span style="position:absolute;top:3px;left:3px;background:#4F46E5;color:white;font-size:0.62rem;font-weight:700;padding:1px 5px;border-radius:4px;">MAIN</span>' : ''}
                <button type="button" onclick="removePhoto(${idx})" style="position:absolute;top:2px;right:2px;background:#EF4444;color:white;border:none;border-radius:50%;width:20px;height:20px;font-size:0.65rem;cursor:pointer;line-height:20px;text-align:center;">&times;</button>
            </div>
        `).join('');
    }

    window.removePhoto = function(idx) {
        vehiclePhotos.splice(idx, 1);
        renderPhotoPreview();
    };

    window.editVehicle = function(id) {
        const v = fleetData.find(x => x.id === id);
        if (!v) return;
        document.getElementById('vehicleId').value = v.id;
        document.getElementById('vehicleFormTitle').textContent = 'Edit Vehicle';
        document.getElementById('vName').value = v.name;
        document.getElementById('vCategory').value = v.category;
        document.getElementById('vSeats').value = v.seats;
        document.getElementById('vSortOrder').value = v.sort_order;
        document.getElementById('vDescription').value = v.description;
        document.getElementById('vFeatures').value = v.features.join('\n');
        vehiclePhotos = [...v.photos];
        renderPhotoPreview();
        document.getElementById('vehicleFormPanel').style.display = 'block';
        document.getElementById('vehicleFormPanel').scrollIntoView({ behavior: 'smooth' });
    };

    window.toggleVehicleStatus = function(id, newActive) {
        const v = fleetData.find(x => x.id === id);
        if (!v) return;
        fetch(`/api/fleet/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...v, is_active: newActive })
        }).then(() => loadAdminFleet());
    };

    window.deleteVehicle = function(id) {
        if (!confirm('Delete this vehicle? This cannot be undone.')) return;
        fetch(`/api/fleet/${id}`, { method: 'DELETE' })
            .then(() => loadAdminFleet())
            .catch(err => console.error('Delete error:', err));
    };

    // Add Vehicle button
    const btnAddVehicle = document.getElementById('btnAddVehicle');
    if (btnAddVehicle) {
        btnAddVehicle.addEventListener('click', () => {
            document.getElementById('vehicleId').value = '';
            document.getElementById('vehicleFormTitle').textContent = 'Add New Vehicle';
            document.getElementById('vehicleForm').reset();
            vehiclePhotos = [];
            renderPhotoPreview();
            document.getElementById('vehicleFormPanel').style.display = 'block';
            document.getElementById('vehicleFormPanel').scrollIntoView({ behavior: 'smooth' });
        });
    }

    const btnCancelVehicle = document.getElementById('btnCancelVehicle');
    if (btnCancelVehicle) {
        btnCancelVehicle.addEventListener('click', () => {
            document.getElementById('vehicleFormPanel').style.display = 'none';
        });
    }

    // Add photo by URL
    const btnAddPhoto = document.getElementById('btnAddPhoto');
    if (btnAddPhoto) {
        btnAddPhoto.addEventListener('click', () => {
            const url = document.getElementById('photoUrlInput').value.trim();
            if (!url) return;
            vehiclePhotos.push(url);
            renderPhotoPreview();
            document.getElementById('photoUrlInput').value = '';
        });
    }

    // Upload photo from device (convert to base64)
    const btnUploadPhoto = document.getElementById('btnUploadPhoto');
    const photoFileInput = document.getElementById('photoFileInput');
    if (btnUploadPhoto && photoFileInput) {
        btnUploadPhoto.addEventListener('click', () => photoFileInput.click());
        photoFileInput.addEventListener('change', () => {
            const files = Array.from(photoFileInput.files);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    vehiclePhotos.push(e.target.result);
                    renderPhotoPreview();
                };
                reader.readAsDataURL(file);
            });
            photoFileInput.value = '';
        });
    }

    // Save Vehicle Form
    const vehicleForm = document.getElementById('vehicleForm');
    if (vehicleForm) {
        vehicleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('vehicleId').value;
            const payload = {
                name: document.getElementById('vName').value.trim(),
                category: document.getElementById('vCategory').value,
                badge: document.getElementById('vCategory').value,
                seats: document.getElementById('vSeats').value.trim(),
                description: document.getElementById('vDescription').value.trim(),
                features: document.getElementById('vFeatures').value.split('\n').map(s => s.trim()).filter(Boolean),
                photos: vehiclePhotos,
                sort_order: parseInt(document.getElementById('vSortOrder').value) || 99,
                is_active: true
            };

            const url = id ? `/api/fleet/${id}` : '/api/fleet';
            const method = id ? 'PUT' : 'POST';

            fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(r => r.json())
            .then(() => {
                const msg = document.getElementById('vehicleFormMsg');
                msg.style.display = 'block';
                msg.style.color = '#10B981';
                msg.textContent = id ? 'Vehicle updated successfully!' : 'Vehicle added successfully!';
                setTimeout(() => {
                    msg.style.display = 'none';
                    document.getElementById('vehicleFormPanel').style.display = 'none';
                    loadAdminFleet();
                }, 1500);
            })
            .catch(err => {
                const msg = document.getElementById('vehicleFormMsg');
                msg.style.display = 'block';
                msg.style.color = '#EF4444';
                msg.textContent = 'Error saving vehicle. Please try again.';
            });
        });
    }

    // ==========================================
    // CONTACT SETTINGS
    // ==========================================
    function loadContactSettings() {
        fetch('/api/contact-settings')
            .then(r => r.json())
            .then(data => {
                if (document.getElementById('cPhone1')) document.getElementById('cPhone1').value = data.phone1 || '';
                if (document.getElementById('cPhone2')) document.getElementById('cPhone2').value = data.phone2 || '';
                if (document.getElementById('cWhatsapp')) document.getElementById('cWhatsapp').value = data.whatsapp || '';
                if (document.getElementById('cFacebook')) document.getElementById('cFacebook').value = data.facebook_url || '';
                if (document.getElementById('cInstagram')) document.getElementById('cInstagram').value = data.instagram_url || '';
            })
            .catch(err => console.error('Contact settings load error:', err));
    }

    const contactSettingsForm = document.getElementById('contactSettingsForm');
    if (contactSettingsForm) {
        contactSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const payload = {
                phone1: document.getElementById('cPhone1').value.trim(),
                phone2: document.getElementById('cPhone2').value.trim(),
                whatsapp: document.getElementById('cWhatsapp').value.trim(),
                facebook_url: document.getElementById('cFacebook').value.trim(),
                instagram_url: document.getElementById('cInstagram').value.trim()
            };
            fetch('/api/contact-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(r => r.json())
            .then(() => {
                const msg = document.getElementById('contactSettingsMsg');
                msg.style.display = 'block';
                msg.style.color = '#10B981';
                msg.textContent = 'Contact info saved and live on website!';
                setTimeout(() => msg.style.display = 'none', 3000);
            })
            .catch(() => {
                const msg = document.getElementById('contactSettingsMsg');
                msg.style.display = 'block';
                msg.style.color = '#EF4444';
                msg.textContent = 'Error saving. Please try again.';
            });
        });
    }

    // ==========================================
    // PUBLIC TESTIMONIALS (Reviews)
    // ==========================================
    let reviewsData = [];

    function loadAdminReviews() {
        fetch('/api/reviews')
            .then(r => r.json())
            .then(data => {
                reviewsData = data;
                renderReviewsTable();
            })
            .catch(err => console.error('Reviews load error:', err));
    }

    function renderReviewsTable() {
        const tbody = document.getElementById('reviewsAdminTableBody');
        if (!tbody) return;

        if (reviewsData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#94A3B8;">No public testimonials yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = reviewsData.map(r => {
            const stars = Array.from({ length: 5 }, (_, i) =>
                `<i class="fa-${i < r.rating ? 'solid' : 'regular'} fa-star" style="color:#F59E0B;font-size:0.8rem;"></i>`
            ).join('');

            const dateStr = r.created_at ? formatDate(r.created_at) : '—';
            const snippet = r.review.length > 90 ? r.review.substring(0, 90) + '…' : r.review;

            return `
                <tr>
                    <td style="font-weight:600;">${r.name}</td>
                    <td style="color:#64748B;font-size:0.85rem;">${r.role}</td>
                    <td>${stars}</td>
                    <td style="font-size:0.85rem;color:#475569;max-width:240px;">"${snippet}"</td>
                    <td style="font-size:0.82rem;color:#94A3B8;">${dateStr}</td>
                    <td style="text-align:center;">
                        <button onclick="deleteReview(${r.id})" style="padding:0.35rem 0.75rem;background:#FEF2F2;color:#DC2626;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:0.8rem;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    window.deleteReview = function(id) {
        if (!confirm('Delete this testimonial permanently? It will be removed from the website.')) return;
        fetch(`/api/reviews/${id}`, { method: 'DELETE' })
            .then(r => r.json())
            .then(() => {
                reviewsData = reviewsData.filter(r => r.id !== id);
                renderReviewsTable();
            })
            .catch(() => alert('Delete failed. Please try again.'));
    };

});

